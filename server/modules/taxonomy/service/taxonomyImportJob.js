import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import Job from '@server/job/job'

import { languageCodesISO639part2 } from '@core/app/languages'
import * as StringUtils from '@core/stringUtils'
import * as CSVReader from '@server/utils/file/csvReader'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import * as TaxonomyManager from '../manager/taxonomyManager'
import TaxonomyImportManager from '../manager/taxonomyImportManager'

import TaxonCSVParser from './taxonCSVParser'

const requiredColumns = ['code', 'scientific_name']
const fixedColumns = [...requiredColumns, 'family', 'genus']

const filterExtraPropsColumns = (columns) =>
  columns.filter((column) => !fixedColumns.includes(column) && !languageCodesISO639part2.includes(column))

export default class TaxonomyImportJob extends Job {
  constructor(params) {
    super(TaxonomyImportJob.type, params)

    const { taxonomyUuid, filePath } = params

    this.taxonomyUuid = taxonomyUuid
    this.filePath = filePath

    this.csvReader = null
    this.taxonomyImportManager = null // To be initialized in onHeaders
    this.vernacularLanguageCodes = null
    this.extraPropsDefs = null
    this.taxonCSVParser = null
    this.currentRow = 0
  }

  async execute() {
    const { user, surveyId, taxonomyUuid, tx } = this

    this.logDebug(`starting taxonomy import on survey ${surveyId}, taxonomy ${taxonomyUuid}`)

    await ActivityLogManager.insert(
      user,
      surveyId,
      ActivityLog.type.taxonomyTaxaImport,
      { uuid: taxonomyUuid },
      false,
      tx
    )

    // 1. load taxonomy

    this.taxonomy = await TaxonomyManager.fetchTaxonomyByUuid(surveyId, taxonomyUuid, true, false, tx)

    if (!Taxonomy.isPublished(this.taxonomy)) {
      // 2. delete old draft taxa (only if taxonomy is not published)
      this.logDebug('delete old draft taxa')
      await TaxonomyManager.deleteDraftTaxaByTaxonomyUuid(user, surveyId, taxonomyUuid, tx)
    }

    // 3. start CSV row parsing
    this.logDebug('start CSV file parsing')

    this.csvReader = CSVReader.createReaderFromFile(
      this.filePath,
      async (headers) => this._onHeaders(headers),
      async (row) => this._onRow(row),
      (total) => {
        this.total = total
      }
    )
    await this.csvReader.start()

    this.logDebug(`CSV file processed, ${this.processed} rows processed`)

    // 4. finalize import
    if (this.isRunning()) {
      if (this.hasErrors()) {
        this.logDebug(`${R.keys(this.errors).length} errors found`)
        await this.setStatusFailed()
      } else {
        this.logDebug('no errors found, finalizing import')
        await this.taxonomyImportManager.finalizeImport()
      }
    }
  }

  async cancel() {
    await super.cancel()

    if (this.csvReader) {
      this.csvReader.cancel()
    }
  }

  async _onHeaders(headers) {
    const validHeaders = this._validateHeaders(headers)
    if (validHeaders) {
      // vernacular lang codes
      this.vernacularLanguageCodes = R.innerJoin((a, b) => a === b, languageCodesISO639part2, headers)
      // extra prop defs
      const extraPropsColumns = filterExtraPropsColumns(headers)

      this.extraPropsDefs = extraPropsColumns.reduce((extraPropsAcc, header, index) => {
        const extraPropNameNormalized = StringUtils.normalizeName(header)
        return {
          ...extraPropsAcc,
          [extraPropNameNormalized]: { key: extraPropNameNormalized, originalHeader: header, index },
        }
      }, {})
      this.taxonomyImportManager = new TaxonomyImportManager({
        user: this.user,
        surveyId: this.surveyId,
        taxonomy: this.taxonomy,
        vernacularLanguageCodes: this.vernacularLanguageCodes,
        extraPropsDefs: this.extraPropsDefs,
        tx: this.tx,
      })
      await this.taxonomyImportManager.init()

      this.taxonCSVParser = new TaxonCSVParser({
        taxonomyUuid: this.taxonomyUuid,
        vernacularLanguageCodes: this.vernacularLanguageCodes,
        extraPropsDefs: this.extraPropsDefs,
      })
    } else {
      this.logDebug('invalid headers, setting status to "failed"')
      this.csvReader.cancel()
      await this.setStatusFailed()
    }
  }

  async _onRow(row) {
    this.currentRow += 1
    const taxon = await this.taxonCSVParser.parseTaxon(row)

    if (Validation.isObjValid(taxon)) {
      await this.addTaxonToUpdateBuffer(taxon)
    } else {
      this.addError(R.pipe(Validation.getValidation, Validation.getFieldValidations)(taxon))
    }

    this.incrementProcessedItems()
  }

  async addTaxonToUpdateBuffer(taxon) {
    const { error } = await this.taxonomyImportManager.addTaxonToUpdateBuffer(taxon)
    if (error) {
      const { params: errorParams } = error
      const errorUpdated = { ...error, params: { ...errorParams, currentRow: this.currentRow } }
      this.addError({
        [Taxon.propKeys.code]: {
          valid: false,
          errors: [errorUpdated],
        },
      })
    }
  }

  _addHeaderError({ key, params }) {
    this.addError({
      all: {
        valid: false,
        errors: [{ key, params }],
      },
    })
  }

  _validateHeaders(columns) {
    let valid = true
    const missingColumns = R.difference(requiredColumns, columns)
    if (!R.isEmpty(missingColumns)) {
      this._addHeaderError({
        key: Validation.messageKeys.taxonomyImportJob.missingRequiredColumns,
        params: { columns: R.join(', ', missingColumns) },
      })
      valid = false
    }

    // validate extra props column names (normalized) uniqueness
    const extraPropsColumns = filterExtraPropsColumns(columns)
    const extraPropsColumnsNormalized = extraPropsColumns.map(StringUtils.normalizeName)
    if (extraPropsColumns.length !== new Set(extraPropsColumnsNormalized).size) {
      const duplicateColumns = Array.from(
        new Set(extraPropsColumnsNormalized.filter((item, index, arr) => arr.indexOf(item) !== index))
      ).join(', ')

      this._addHeaderError({
        key: Validation.messageKeys.taxonomyImportJob.duplicateExtraPropsColumns,
        params: { duplicateColumns },
      })
      valid = false
    }

    // validate extra prop cannot be keyword
    extraPropsColumnsNormalized.forEach((columnName) => {
      if (Validator.isKeyword(columnName)) {
        this._addHeaderError({
          key: Validation.messageKeys.taxonomyImportJob.invalidExtraPropColumn,
          params: { columnName },
        })
        valid = false
      }
    })

    return valid
  }
}

TaxonomyImportJob.type = 'TaxonomyImportJob'
