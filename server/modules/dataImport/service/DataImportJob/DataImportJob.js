import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { RecordsUpdateThreadService } from '@server/modules/record/service/update/surveyRecordsThreadService'

import { DataImportFileReader } from './dataImportFileReader'
import { DataImportJobRecordProvider } from './recordProvider'
import DataImportBaseJob from './DataImportBaseJob'

export default class DataImportJob extends DataImportBaseJob {
  constructor(params, type = DataImportJob.type) {
    super(type, params)

    this.csvReader = null
  }

  async execute() {
    super.execute()

    const { context } = this
    const { abortOnErrors, dryRun } = context

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
    const { survey, nodeDefUuid, insertNewRecords } = this.context

    if (!nodeDefUuid || !Survey.getNodeDefByUuid(nodeDefUuid)(survey)) {
      throw new Error('Entity to import data into not specified')
    }

    if (insertNewRecords) {
      // when inserting new records, only root entity can be selected
      const rootEntityDef = Survey.getNodeDefRoot(survey)
      if (NodeDef.getUuid(rootEntityDef) !== nodeDefUuid) {
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
    const { cycle, nodeDefUuid, filePath, survey } = this.context

    try {
      this.csvReader = await DataImportFileReader.createReader({
        filePath,
        survey,
        cycle,
        nodeDefUuid,
        onRowItem: async (item) => this.onRowItem(item),
        onTotalChange: (total) => (this.total = total),
      })

      await this.csvReader.start()
    } catch (e) {
      const errorKey = e.key || e.toString()
      const errorParams = e.params
      this._addError(errorKey, errorParams)
    }
  }

  async cancel() {
    await super.cancel()

    this.csvReader?.cancel()
  }

  async onRowItem({ valuesByDefUuid, errors }) {
    const { context, tx } = this
    const { nodeDefUuid, insertMissingNodes, survey } = context

    if (this.isCanceled()) {
      return
    }

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

      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const ancestorMultipleEntityDef = NodeDef.isMultipleAttribute(nodeDef)
        ? Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
        : nodeDef
      const entityDefUuid = NodeDef.getUuid(ancestorMultipleEntityDef)

      const sideEffect = true

      const { entity, updateResult: entityUpdateResult } = await Record.getOrCreateEntityByKeys({
        survey,
        entityDefUuid,
        valuesByDefUuid,
        insertMissingNodes,
        sideEffect,
      })(this.currentRecord)

      this.currentRecord = entityUpdateResult.record

      const { record: recordUpdated, nodes: nodesUpdated } = await Record.updateAttributesInEntityWithValues({
        survey,
        entity,
        valuesByDefUuid,
        sideEffect,
      })(this.currentRecord)

      this.currentRecord = recordUpdated

      await this.persistUpdatedNodes({ nodesUpdated })

      // update counts
      const recordUuid = Record.getUuid(this.currentRecord)
      if (newRecord) {
        this.updatedValues += Record.getNodesArray(this.currentRecord).length
        this.insertedRecordsUuids.add(recordUuid)
      } else {
        const nodesArray = Object.values(nodesUpdated)
        if (nodesArray.length > 0) {
          this.updatedValues += nodesArray.length
          this.updatedRecordsUuids.add(recordUuid)
        }
      }
    } catch (e) {
      const { key, params } = e
      const errorKey = key ?? Validation.messageKeys.dataImport.errorUpdatingValues
      this._addError(errorKey, params)
    }
  }

  onRecordParentEntityGet({ record, entity, valuesByDefUuid }) {
    // clear multiple attributes
  }

  generateResult() {
    const result = super.generateResult()
    const { dryRun } = this.context
    return { ...result, dryRun }
  }

  async beforeSuccess() {
    await super.beforeSuccess()
    const { surveyId } = this
    const { cycle } = this.context

    // clear records from update thread
    this.updatedRecordsUuids.forEach((recordUuid) =>
      RecordsUpdateThreadService.clearRecordDataFromThread({ surveyId, cycle, draft: false, recordUuid })
    )
  }

  _addError(key, params = {}) {
    this.addError({
      error: Validation.newInstance(false, {}, [{ key, params }]),
    })
  }
}

DataImportJob.type = 'DataImportJob'
