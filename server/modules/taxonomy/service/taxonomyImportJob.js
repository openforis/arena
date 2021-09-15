import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import Job from '@server/job/job'

import { languageCodesISO639part2 } from '@core/app/languages'
import * as CSVReader from '@server/utils/file/csvReader'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'

import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'
import * as TaxonomyManager from '../manager/taxonomyManager'
import TaxonomyImportManager from '../manager/taxonomyImportManager'

import TaxonCSVParser from './taxonCSVParser'

const requiredColumns = ['code', 'scientific_name']
const fixedColumns = [...requiredColumns, 'family', 'genus']

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
      this.vernacularLanguageCodes = R.innerJoin((a, b) => a === b, languageCodesISO639part2, headers)
      this.extraPropsDefs = headers.reduce((extraPropsAcc, header) => {
        if (!fixedColumns.includes(header) && !languageCodesISO639part2.includes(header)) {
          extraPropsAcc[header] = { key: header }
        }
        return extraPropsAcc
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
      this.taxonCSVParser = new TaxonCSVParser(this.taxonomyUuid, this.vernacularLanguageCodes)
    } else {
      this.logDebug('invalid headers, setting status to "failed"')
      this.csvReader.cancel()
      await this.setStatusFailed()
    }
  }

  async _onRow(row) {
    const taxon = await this.taxonCSVParser.parseTaxon(row)

    if (Validation.isObjValid(taxon)) {
      await this.taxonomyImportManager.addTaxonToUpdateBuffer(taxon)
    } else {
      this.addError(R.pipe(Validation.getValidation, Validation.getFieldValidations)(taxon))
    }

    this.incrementProcessedItems()
  }

  _validateHeaders(columns) {
    this.logDebug('columns', columns)
    const missingColumns = R.difference(requiredColumns, columns)
    if (R.isEmpty(missingColumns)) {
      return true
    }

    this.addError({
      all: {
        valid: false,
        errors: [
          {
            key: Validation.messageKeys.taxonomyImportJob.missingRequiredColumns,
            params: { columns: R.join(', ', missingColumns) },
          },
        ],
      },
    })
    return false
  }
}

TaxonomyImportJob.type = 'TaxonomyImportJob'
