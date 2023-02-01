import { SRSs } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { RecordsValidationBatchPersister } from '@server/modules/record/manager/RecordsValidationBatchPersister'
import { NodesInsertBatchPersister } from '@server/modules/record/manager/NodesInsertBatchPersister'
import { NodesUpdateBatchPersister } from '@server/modules/record/manager/NodesUpdateBatchPersister'

import { DataImportFileReader } from './dataImportFileReader'
import { DataImportJobRecordProvider } from './recordProvider'

export default class DataImportJob extends Job {
  constructor(params, type = DataImportJob.type) {
    super(type, params)

    this.insertedRecordsUuids = new Set()
    this.updatedRecordsUuids = new Set()
    this.updatedValues = 0

    this.currentRecord = null
    this.nodesUpdateBatchPersister = null
    this.nodesInsertBatchPersister = null
    this.recordsValidationBatchPersister = null
  }

  async onStart() {
    await super.onStart()
    await SRSs.init()
  }

  async execute() {
    const { context, user, surveyId, tx } = this
    const { abortOnErrors, dryRun } = context

    this.nodesUpdateBatchPersister = new NodesUpdateBatchPersister({ user, surveyId, tx })
    this.nodesInsertBatchPersister = new NodesInsertBatchPersister({ user, surveyId, tx })
    this.recordsValidationBatchPersister = new RecordsValidationBatchPersister({ surveyId, tx })

    await this.fetchSurvey()

    this.validateParameters()

    await this.fetchRecordsSummary()

    await this.startCsvReader()

    if (!this.hasErrors() && this.processed === 0) {
      // Error: empty file
      this._addError(Validation.messageKeys.dataImport.emptyFile)
    }
    if (this.isRunning() && this.hasErrors() && abortOnErrors && !dryRun) {
      this.logDebug('Errors found and abortOnErrors is true: aborting transaction')
      this.setStatusFailed()
      throw new Error('abort_transaction')
    }
  }

  validateParameters() {
    const { survey, entityDefUuid, insertNewRecords } = this.context

    if (!entityDefUuid || !Survey.getNodeDefByUuid(entityDefUuid)(survey)) {
      throw new Error('Entity to import data into not specified')
    }

    if (insertNewRecords) {
      // when inserting new records, only root entity can be selected
      const rootEntityDef = Survey.getNodeDefRoot(survey)
      if (NodeDef.getUuid(rootEntityDef) !== entityDefUuid) {
        throw new Error('New records can be inserted only selecting the root entity definition')
      }
    }
  }

  async fetchSurvey() {
    const { surveyId, tx } = this
    const { cycle } = this.context

    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, cycle, draft: false, advanced: true },
      tx
    )
    this.setContext({ survey })
  }

  async fetchRecordsSummary() {
    const { surveyId, tx } = this
    const { cycle } = this.context

    // fetch all records summary once to make the record fetch faster
    const recordsSummary = await RecordManager.fetchRecordsSummaryBySurveyId(
      {
        surveyId,
        cycle,
        offset: 0,
        limit: null,
      },
      tx
    )

    this.setContext({ recordsSummary: recordsSummary.list })
  }

  async startCsvReader() {
    const { entityDefUuid, filePath, survey } = this.context

    try {
      const reader = await DataImportFileReader.createReader({
        filePath,
        survey,
        entityDefUuid,
        onRowItem: (item) => this.onRowItem(item),
        onTotalChange: (total) => (this.total = total),
      })

      await reader.start()
    } catch (e) {
      const errorKey = e.key || e.toString()
      const errorParams = e.params
      this._addError(errorKey, errorParams)
    }
  }

  async persistUpdatedNodes({ nodesUpdated }) {
    const { context, currentRecord: record, tx } = this
    const { dryRun, survey } = context

    const nodesArray = Object.values(nodesUpdated)

    if (!dryRun && nodesArray.length > 0) {
      await this.recordsValidationBatchPersister.addItem([Record.getUuid(record), Record.getValidation(record)])

      this.currentRecord = await RecordManager.persistNodesToRDB({ survey, record, nodesArray }, tx)

      await this.nodesInsertBatchPersister.addItems(nodesArray.filter(Node.isCreated))
      await this.nodesUpdateBatchPersister.addItems(nodesArray.filter((node) => !Node.isCreated(node)))
    }
  }

  async onRowItem({ valuesByDefUuid, errors }) {
    const { context, tx } = this
    const { entityDefUuid, insertMissingNodes, survey } = context

    this.incrementProcessedItems()

    errors.forEach((error) => {
      this._addError(error.key || error.toString(), error.params)
    })

    try {
      const { record, newRecord } = await DataImportJobRecordProvider.fetchOrCreateRecord({
        valuesByDefUuid,
        currentRecord: this.currentRecord,
        context,
        tx,
      })
      this.currentRecord = record

      const { record: recordUpdated, nodes: nodesUpdated } = await Record.updateAttributesWithValues({
        survey,
        entityDefUuid,
        valuesByDefUuid,
        insertMissingNodes,
      })(this.currentRecord)

      this.currentRecord = recordUpdated

      this.persistUpdatedNodes({ nodesUpdated })

      // update counts
      if (newRecord) {
        this.updatedValues += Record.getNodesArray(this.currentRecord).length
      } else {
        const nodesArray = Object.values(nodesUpdated)
        if (nodesArray.length > 0) {
          this.updatedValues += nodesArray.length
          this.updatedRecordsUuids.add(Record.getUuid(this.currentRecord))
        }
      }
    } catch (e) {
      const { key, params } = e
      const errorKey = key || Validation.messageKeys.dataImport.errorUpdatingValues
      this._addError(errorKey, params)
    }
  }

  async beforeSuccess() {
    await this.nodesInsertBatchPersister.flush()
    await this.nodesUpdateBatchPersister.flush()
    await this.recordsValidationBatchPersister.flush()

    const {
      context,
      errors,
      insertedRecordsUuids,
      updatedRecordsUuids: updatedRecordsByUuid,
      processed: rowsProcessed,
      updatedValues,
    } = this

    const { dryRun } = context

    this.setResult({
      insertedRecords: insertedRecordsUuids.size,
      updatedRecords: updatedRecordsByUuid.size,
      rowsProcessed,
      updatedValues,
      dryRun,
      errorsCount: Object.keys(errors).length,
    })
  }

  _addError(key, params = {}) {
    this.addError({
      error: Validation.newInstance(false, {}, [{ key, params }]),
    })
  }
}

DataImportJob.type = 'DataImportJob'
