import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import Job from '@server/job/job'

import { languageCodes } from '@core/app/languages';
import { isNotBlank } from '@core/stringUtils';
import * as CSVReader from '@server/utils/file/csvReader'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as Validation from '@core/validation/validation'

import * as TaxonomyValidator from '../taxonomyValidator'
import * as TaxonomyManager from '../manager/taxonomyManager'
import TaxonomyImportManager from '../manager/taxonomyImportManager'

import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'

const requiredColumns = [
  'code',
  'family',
  'genus',
  'scientific_name',
]

export default class TaxonomyImportJob extends Job {

  constructor (params) {
    super(TaxonomyImportJob.type, params)

    const { taxonomyUuid, filePath } = params

    this.taxonomyUuid = taxonomyUuid
    this.filePath = filePath

    this.rowsByField = {
      [Taxon.propKeys.code]: {}, //maps codes to csv file rows
      [Taxon.propKeys.scientificName]: {} //maps scientific names to csv file rows
    }

    this.taxonomyImportManager = null //to be initialized in onHeaders

    this.csvReader = null
  }

  async execute () {
    const { user, surveyId, taxonomyUuid, tx } = this

    this.logDebug(`starting taxonomy import on survey ${surveyId}, taxonomy ${taxonomyUuid}`)

    await ActivityLogManager.insert(user, surveyId, ActivityLog.type.taxonomyTaxaImport, { uuid: taxonomyUuid }, false, tx)

    // 1. load taxonomy

    this.taxonomy = await TaxonomyManager.fetchTaxonomyByUuid(surveyId, taxonomyUuid, true, false, tx)

    if (!Taxonomy.isPublished(this.taxonomy)) {
      // 2. delete old draft taxa (only if taxonomy is not published)
      this.logDebug('delete old draft taxa')
      await TaxonomyManager.deleteDraftTaxaByTaxonomyUuid(user, surveyId, taxonomyUuid, tx)
    }

    // 3. start CSV row parsing
    this.logDebug('start CSV file parsing')

    this.csvReader = await (CSVReader.createReaderFromFile(
      this.filePath,
      async headers => await this._onHeaders(headers),
      async row => await this._onRow(row),
      total => this.total = total
    )).start()

    this.logDebug(`CSV file processed, ${this.processed} rows processed`)

    // 4. finalize import
    if (this.isRunning()) {
      if (this.hasErrors()) {
        this.logDebug(`${R.keys(this.errors).length} errors found`)
        await this.setStatusFailed()
      } else {
        this.logDebug('no errors found, finalizing import')
        await this.taxonomyImportManager.finalizeImport(this.taxonomy, tx)
      }
    }
  }

  async cancel () {
    await super.cancel()

    if (this.csvReader)
      this.csvReader.cancel()
  }

  async _onHeaders (headers) {
    const validHeaders = this._validateHeaders(headers)
    if (validHeaders) {
      this.vernacularLanguageCodes = R.innerJoin((a, b) => a === b, languageCodes, headers)
      this.taxonomyImportManager = new TaxonomyImportManager(this.user, this.surveyId, this.vernacularLanguageCodes)
    } else {
      this.logDebug('invalid headers, setting status to "failed"')
      this.csvReader.cancel()
      await this.setStatusFailed()
    }
  }

  async _onRow (row) {
    const taxon = await this._parseTaxon(row)

    if (Validation.isObjValid(taxon)) {
      await this.taxonomyImportManager.addTaxonToInsertBuffer(taxon, this.tx)
    } else {
      this.addError(R.pipe(Validation.getValidation, Validation.getFieldValidations)(taxon))
    }
    this.incrementProcessedItems()
  }

  _validateHeaders (columns) {
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

  async _parseTaxon (data) {
    const { family, genus, scientific_name, code, ...vernacularNames } = data

    const taxon = Taxon.newTaxon(this.taxonomyUuid, code, family, genus, scientific_name, this._parseVernacularNames(vernacularNames))

    return await this._validateTaxon(taxon)
  }

  async _validateTaxon (taxon) {
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

  _parseVernacularNames (vernacularNames) {
    return R.reduce((acc, langCode) => {
      const vernacularName = vernacularNames[langCode]
      return isNotBlank(vernacularName) ? R.assoc(langCode, vernacularName, acc) : acc
    }, {}, this.vernacularLanguageCodes)
  }
}

TaxonomyImportJob.type = 'TaxonomyImportJob'
