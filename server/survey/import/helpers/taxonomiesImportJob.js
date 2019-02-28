const R = require('ramda')

const Taxonomy = require('../../../../common/survey/taxonomy')

const Job = require('../../../job/job')

const TaxonomyManager = require('../../../taxonomy/taxonomyManager')

const XMLParseUtils = require('./xmlParseUtils')
const ZipFileUtils = require('../../../../common/zipFileUtils')

const CSVParser = require('../../../csv/csvParser')

const speciesFilesPath = 'species/'

/**
 * Inserts a taxonomy for each taxonomy in the Collect survey.
 * Saves the list of inserted taxonomies in the "taxonomies" context property
 */
class TaxonomiesImportJob extends Job {

  constructor (params) {
    super('TaxonomiesImportJob', params)
  }

  async execute (tx) {
    const { zipFile, surveySource, surveyId } = this.context

    this.context.taxonomies = []

    const speciesFileNames = ZipFileUtils.entries(zipFile, speciesFilesPath)

    this.total = speciesFileNames.length

    for (const speciesFileName of speciesFileNames) {
      const taxonomy = await this.importTaxonomyFromSpeciesFile(speciesFileName)

      this.context.taxonomies.push(taxonomy)

      this.incrementProcessedItems()
    }
  }

  async importTaxonomyFromSpeciesFile (speciesFileName) {
    const { zipFile, surveySource, surveyId } = this.context

    const taxonomyName = speciesFileName.substring(0, speciesFileName.length - 4)

    const taxonomyParam = Taxonomy.newTaxonomy({
      [Taxonomy.taxonomyPropKeys.name]: taxonomyName
    })
    const taxonomy = await TaxonomyManager.createTaxonomy(this.user, surveyId, taxonomyParam)

    const entryName = `${speciesFilesPath}${speciesFileName}`

    const speciesFileStream = ZipFileUtils.getEntryStream(zipFile, entryName)

    const csvParser = new CSVParser(speciesFileStream, true)
    let speciesRow = await csvParser.next()
    while (speciesRow !== null) {
      console.log(speciesRow)

      speciesRow = await csvParser.next()
    }

    return taxonomy
  }
}

module.exports = TaxonomiesImportJob