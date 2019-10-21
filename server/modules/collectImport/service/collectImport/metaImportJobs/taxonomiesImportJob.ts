import * as R from 'ramda'

import Taxonomy from '../../../../../../core/survey/taxonomy'
import Taxon from '../../../../../../core/survey/taxon'
import Validation from '../../../../../../core/validation/validation'
import { languageCodesISO636_2 } from '../../../../../../core/app/languages'

import Job from '../../../../../job/job'

import TaxonomyManager from '../../../../taxonomy/manager/taxonomyManager'
import TaxonomyImportManager from '../../../../taxonomy/manager/taxonomyImportManager'

import CSVReader from '../../../../../utils/file/csvReader'

const speciesFilesPath = 'species/'

/**
 * Inserts a taxonomy for each taxonomy in the Collect survey.
 * Saves the list of inserted taxonomies in the "taxonomies" context property
 */
export default class TaxonomiesImportJob extends Job {
	taxonomyImportManager: any;
	rowsByCode: any;
	rowsByScientificName: any;
	currentRow: any;
	context: any;

  headers: any;
	vernacularLangCodes: any;

  constructor (params?) {
    super('TaxonomiesImportJob', params)

    this.taxonomyImportManager = null
    this.rowsByCode = {} //used to detect duplicate codes
    this.rowsByScientificName = {} //used to detect duplicate scientific names
    this.currentRow = 0 //current file row number
  }

  async execute (tx) {
    const { collectSurveyFileZip } = this.context

    const taxonomies = []

    const speciesFileNames = collectSurveyFileZip.getEntryNames(speciesFilesPath)

    for (const speciesFileName of speciesFileNames) {
      if (this.isCanceled())
        break

      const taxonomy = await this.importTaxonomyFromSpeciesFile(speciesFileName, tx)

      if (!this.isRunning())
        break

      taxonomies.push(taxonomy)

      this.incrementProcessedItems()
    }

    this.setContext({ taxonomies })
  }

  async importTaxonomyFromSpeciesFile (speciesFileName, tx) {
    const { collectSurveyFileZip, surveyId } = this.context

    // 1. reset duplicate values indexes
    this.rowsByCode = {}
    this.rowsByScientificName = {}

    // 2. insert taxonomy
    const taxonomyName = speciesFileName.substring(0, speciesFileName.length - 4)

    const taxonomyParam = Taxonomy.newTaxonomy({
      [Taxonomy.keysProps.name]: taxonomyName,
    })
    const taxonomy = await TaxonomyManager.insertTaxonomy(this.user, surveyId, taxonomyParam, tx)
    const taxonomyUuid = Taxonomy.getUuid(taxonomy)

    // 3. parse CSV file
    const speciesFileStream = await collectSurveyFileZip.getEntryStream(`${speciesFilesPath}${speciesFileName}`)

    const totalPrevious = this.total

    await CSVReader.createReaderFromStream(
      speciesFileStream,
      headers => this.onHeaders(headers),
      async row => await this.onRow(speciesFileName, taxonomyUuid, row, tx),
      total => this.total = totalPrevious + total
    ).start()

    if (this.hasErrors()) {
      await this.setStatusFailed()
    } else {
      await this.taxonomyImportManager.finalizeImport(taxonomy, tx)
    }

    return taxonomy
  }

  async onHeaders (headers) {
    this.headers = headers
    this.vernacularLangCodes = R.innerJoin((a, b) => a === b, languageCodesISO636_2, headers)

    this.taxonomyImportManager = new TaxonomyImportManager(this.user, this.surveyId, this.vernacularLangCodes)

    this.currentRow = 1
    this.incrementProcessedItems()
  }

  async onRow (speciesFileName, taxonomyUuid, row: { [lang: string]: any }, tx) {
    const rowIndexed = this._indexRowByHeaders(row)

    if (this.validateRow(speciesFileName, rowIndexed)) {
      const { code, family, scientific_name: scientificName } = rowIndexed

      const genus = R.pipe(R.split(' '), R.head)(scientificName)
      const vernacularNames = R.reduce((acc, lang: string) => {
        const vernacularName = row[lang]
        return vernacularName
          ? R.assoc(lang, vernacularName, acc)
          : acc
      }, {}, this.vernacularLangCodes)

      const taxon = Taxon.newTaxon(taxonomyUuid, code, family, genus, scientificName, vernacularNames)

      await this.taxonomyImportManager.addTaxonToInsertBuffer(taxon, tx)
    }
    this.currentRow++
    this.incrementProcessedItems()
  }

  validateRow (speciesFileName, rowIndexed) {
    // do not try to insert taxa with empty or duplicate code or duplicate scientific name (DB constraints)
    const { code, scientific_name: scientificName } = rowIndexed

    if (!code) {
      // ignore rows with blank code (auto-generated by Collect)
      return false
    }

    // check if code is duplicate
    const rowDuplicateCode = this.rowsByCode[code]
    if (rowDuplicateCode) {
      this.addError({
        [Taxon.propKeys.code]: {
          valid: false,
          errors: [{
            key: Validation.messageKeys.taxonomyEdit.codeDuplicate,
            params: { code, row: this.currentRow, duplicateRow: rowDuplicateCode },
          }],
        },
      }, speciesFileName)
    } else {
      this.rowsByCode[code] = this.currentRow
    }

    // check if scientific name is duplicate
    const rowDuplicateScientificName = this.rowsByScientificName[scientificName]
    if (rowDuplicateScientificName) {
      this.addError({
        [Taxon.propKeys.scientificName]: {
          valid: false,
          errors: [{
            key: Validation.messageKeys.taxonomyEdit.scientificNameDuplicate,
            params: { scientificName, row: this.currentRow, duplicateRow: rowDuplicateScientificName },
          }],
        },
      }, speciesFileName)
    } else {
      this.rowsByScientificName[scientificName] = this.currentRow
    }

    return !(rowDuplicateCode || rowDuplicateScientificName)
  }

  _indexRowByHeaders (row) {
    return this.headers.reduce((acc, header, index) => {
        acc[header] = row[index]
        return acc
      },
      {}
    )
  }
}
