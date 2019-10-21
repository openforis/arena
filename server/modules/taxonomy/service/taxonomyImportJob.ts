import * as R from 'ramda'

import Job from '../../../job/job'

import { languageCodes } from '../../../../core/app/languages'
import { isNotBlank } from '../../../../core/stringUtils'
import CSVParser from '../../../utils/file/csvParser'

import Taxonomy from '../../../../core/survey/taxonomy'
import Taxon from '../../../../core/survey/taxon'
import Validation from '../../../../core/validation/validation'

import TaxonomyValidator from '../taxonomyValidator'
import TaxonomyManager from '../manager/taxonomyManager'
import TaxonomyImportManager from '../manager/taxonomyImportManager'

import SystemError from '../../../../server/utils/systemError'

const requiredColumns = [
  'code',
  'family',
  'genus',
  'scientific_name',
]

export default class TaxonomyImportJob extends Job {
	public taxonomyUuid: any;
	public filePath: any;
	public rowsByField: any;
	public taxonomyImportManager: any;
	public csvParser: any;
  static type: string = 'TaxonomyImportJob'
  vernacularLanguageCodes: any


  constructor (params) {
    super(TaxonomyImportJob.type, params)

    const { taxonomyUuid, filePath } = params

    this.taxonomyUuid = taxonomyUuid
    this.filePath = filePath

    this.rowsByField = {
      [Taxon.propKeys.code]: {}, //maps codes to csv file rows
      [Taxon.propKeys.scientificName]: {} //maps scientific names to csv file rows
    }

    this.taxonomyImportManager = null //to be initialized before starting the import

    this.csvParser = new CSVParser(this.filePath)
  }

  async execute (tx) {
    await this.csvParser.init()

    const { surveyId, taxonomyUuid } = this

    this.logDebug(`starting taxonomy import on survey ${surveyId}, importing into taxonomy ${taxonomyUuid}`)

    // 1. load taxonomy and check it has not published

    const taxonomy = await TaxonomyManager.fetchTaxonomyByUuid(surveyId, taxonomyUuid, true, false, tx)

    if (Taxonomy.isPublished(taxonomy)) {
      throw new SystemError('cannotOverridePublishedTaxa')
    }

    // 2. calculate total number of rows
    this.total = await this.csvParser.calculateSize()

    this.logDebug(`${this.total} rows found in the CSV file`)

    // 3. process headers
    const validHeaders = await this.processHeaders()

    if (!validHeaders) {
      this.logDebug('invalid header, setting status to "failed"')
      await this.setStatusFailed()
      return
    }

    // 4. delete old draft taxa
    await TaxonomyManager.deleteDraftTaxaByTaxonomyUuid(this.user, surveyId, taxonomyUuid, tx)

    // 5. start CSV row parsing
    await this._parseCSVRows(taxonomy)
  }

  async _parseCSVRows (taxonomy) {
    this.logDebug('start CSV file parsing')

    this.taxonomyImportManager = new TaxonomyImportManager(this.user, this.surveyId, this.vernacularLanguageCodes)

    this.processed = 0

    let row = await this.csvParser.next()

    while (row) {
      if (this.isCanceled()) {
        break
      }

      await this.processRow(row)

      row = await this.csvParser.next()
    }

    this.logDebug(`CSV file processed, ${this.processed} rows processed`)

    if (this.isRunning()) {
      if (R.isEmpty(this.errors)) {
        this.logDebug('no errors found, finalizing import')
        await this.taxonomyImportManager.finalizeImport(taxonomy, this.tx)
      } else {
        this.logDebug(`${R.keys(this.errors).length} errors found`)
        await this.setStatusFailed()
      }
    }

    this.csvParser.destroy()
  }

  async processHeaders () {
    const headers = this.csvParser.headers
    const validHeaders = this.validateHeaders(headers)
    if (validHeaders) {
      this.vernacularLanguageCodes = R.innerJoin((a, b) => a === b, languageCodes, headers)
    }
    return validHeaders
  }

  async processRow (data) {
    const taxon = await this.parseTaxon(data)

    if (Validation.isObjValid(taxon)) {
      await this.taxonomyImportManager.addTaxonToInsertBuffer(taxon, this.tx)
    } else {
      this.addError(R.pipe(Validation.getValidation, Validation.getFieldValidations)(taxon))
    }
    this.incrementProcessedItems()
  }

  validateHeaders (columns) {
    const missingColumns = R.difference(requiredColumns, columns)
    if (R.isEmpty(missingColumns)) {
      return true
    } else {
      this.addError({
        all: {
          valid: false,
          errors: [{
            key: Validation.messageKeys.taxonomyImportJob.missingRequiredColumns,
            params: { columns: R.join(', ', missingColumns) }
          }]
        }
      })
      return false
    }
  }

  async parseTaxon (data) {
    const { family, genus, scientific_name, code, ...vernacularNames } = data

    const taxon = Taxon.newTaxon(this.taxonomyUuid, code, family, genus, scientific_name, this.parseVernacularNames(vernacularNames))

    return await this.validateTaxon(taxon)
  }

  async validateTaxon (taxon) {
    const validation = await TaxonomyValidator.validateTaxon([], taxon) //do not validate code and scientific name uniqueness

    //validate taxon uniqueness among inserted values
    if (Validation.isValid(validation)) {
      const code = R.pipe(Taxon.getCode, R.toUpper)(taxon)
      this._addValueToIndex(Taxon.propKeys.code, code, Validation.messageKeys.taxonomyEdit.codeDuplicate, validation)

      const scientificName = Taxon.getScientificName(taxon)
      this._addValueToIndex(Taxon.propKeys.scientificName, scientificName, Validation.messageKeys.taxonomyEdit.scientificNameDuplicate, validation)
    }

    return {
      ...taxon,
      validation,
    }
  }

  _addValueToIndex (field, value, errorKeyDuplicate, validation) {
    const duplicateRow = this.rowsByField[field][value]
    if (duplicateRow) {
      R.pipe(
        Validation.setValid(false),
        Validation.setField(
          field,
          Validation.newInstance(
            false,
            {},
            [{
              key: errorKeyDuplicate,
              params: { row: this.processed + 1, duplicateRow }
            }]
          ))
      )(validation)
    } else {
      this.rowsByField[field][value] = this.processed + 1
    }
  }

  parseVernacularNames (vernacularNames: { [lang: string]: any; }) {
    return R.reduce((acc, langCode: string) => {
      const vernacularName = vernacularNames[langCode]
      return isNotBlank(vernacularName) ? R.assoc(langCode, vernacularName, acc) : acc
    }, {}, this.vernacularLanguageCodes)
  }
}
