const R = require('ramda')

const Taxonomy = require('../../../../../../common/survey/taxonomy')
const { languageCodesISO636_2 } = require('../../../../../../common/app/languages')

const Job = require('../../../../../job/job')

const TaxonomyManager = require('../../../../taxonomy/persistence/taxonomyManager')
const TaxonomyImportManager = require('../../../../taxonomy/persistence/taxonomyImportManager')

const CSVParser = require('../../../../../../common/file/csvParser')

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
    const { collectSurveyFileZip } = this.context

    const taxonomies = []

    const speciesFileNames = collectSurveyFileZip.getEntryNames(speciesFilesPath)

    this.total = speciesFileNames.length

    for (const speciesFileName of speciesFileNames) {
      const taxonomy = await this.importTaxonomyFromSpeciesFile(speciesFileName, tx)

      taxonomies.push(taxonomy)

      this.incrementProcessedItems()
    }

    this.setContext({taxonomies})
  }

  async importTaxonomyFromSpeciesFile (speciesFileName, tx) {
    const { collectSurveyFileZip, surveyId } = this.context

    const taxonomyName = speciesFileName.substring(0, speciesFileName.length - 4)

    const taxonomyParam = Taxonomy.newTaxonomy({
      [Taxonomy.taxonomyPropKeys.name]: taxonomyName
    })
    const taxonomy = await TaxonomyManager.insertTaxonomy(this.getUser(), surveyId, taxonomyParam, tx)
    const taxonomyUuid = Taxonomy.getUuid(taxonomy)

    const speciesFileStream = await collectSurveyFileZip.getEntryStream(`${speciesFilesPath}${speciesFileName}`)

    const csvParser = new CSVParser(speciesFileStream, true)

    let row = await csvParser.next()

    if (row) {
      // read headers from first row

      const headers = R.keys(row)

      const vernacularLangCodes = R.innerJoin((a, b) => a === b, languageCodesISO636_2, headers)

      this.taxonomyImportHelper = new TaxonomyImportManager(this.getUser(), surveyId, vernacularLangCodes)

      while (row) {
        await this.processRow(taxonomyUuid, vernacularLangCodes, row, tx)

        row = await csvParser.next()
      }

      await this.taxonomyImportHelper.finalizeImport(taxonomy, tx)
    }

    return taxonomy
  }

  async processRow (taxonomyUuid, vernacularLangCodes, row, tx) {
    const code = row.code
    if (code) {
      // ignore rows with blank code (auto-generated by Collect)
      const scientificName = row.scientific_name
      const genus = R.pipe(R.split(' '), R.head)(scientificName)
      const vernacularNames = R.reduce((acc, lang) => {
        const vernacularName = row[lang]
        return vernacularName
          ? R.assoc(lang, vernacularName, acc)
          : acc
      }, {}, vernacularLangCodes)

      const taxon = Taxonomy.newTaxon(taxonomyUuid, code, row.family, genus, scientificName, vernacularNames)

      await this.taxonomyImportHelper.addTaxonToInsertBuffer(taxon, tx)
    }
  }
}

module.exports = TaxonomiesImportJob