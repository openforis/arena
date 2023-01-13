import { Objects, SRSs } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import { NodeValues } from '@core/record/nodeValues'
import { NodeValueFormatter } from '@core/record/nodeValueFormatter'
import * as Validation from '@core/validation/validation'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { RecordsValidationBatchPersister } from '@server/modules/record/manager/RecordsValidationBatchPersister'
import { NodesInsertBatchPersister } from '@server/modules/record/manager/NodesInsertBatchPersister'
import { NodesUpdateBatchPersister } from '@server/modules/record/manager/NodesUpdateBatchPersister'

import { DataImportFileReader } from './dataImportFileReader'

export default class DataImportJob extends Job {
  constructor(params) {
    super(DataImportJob.type, params)

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
    const { user, surveyId, tx } = this

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
    if (this.hasErrors()) {
      await this.setStatusFailed()
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

  async getOrFetchRecord({ valuesByDefUuid }) {
    const { cycle, insertNewRecords, recordsSummary, survey, surveyId, updateRecordsInAnalysis, user } = this.context

    // fetch record by root entity key values
    const rootKeyDefs = Survey.getNodeDefRootKeys(survey)

    const rootKeyValuesFormatted = rootKeyDefs.map((rootKeyDef) =>
      NodeValueFormatter.format({
        survey,
        nodeDef: rootKeyDef,
        value: valuesByDefUuid[NodeDef.getUuid(rootKeyDef)],
      })
    )

    // check root keys are not empty
    if (rootKeyValuesFormatted.some(Objects.isEmpty)) {
      this._addError(Validation.messageKeys.dataImport.recordKeysMissing)
      return null
    }

    const recordSummary = recordsSummary.find((record) =>
      rootKeyDefs.every((rootKeyDef) => {
        const keyValueInRecord = record[A.camelize(NodeDef.getName(rootKeyDef))]
        const keyValueInRow = valuesByDefUuid[NodeDef.getUuid(rootKeyDef)]

        return NodeValues.isValueEqual({
          survey,
          nodeDef: rootKeyDef,
          value: keyValueInRecord,
          valueSearch: keyValueInRow,
        })
      })
    )

    const keyNameValuesPairs = rootKeyDefs
      .map((keyDef, index) => {
        const name = NodeDef.getName(keyDef)
        const value = rootKeyValuesFormatted[index]
        return `${name}=${value}`
      })
      .join(',')

    if (insertNewRecords) {
      // check if record with the same key values already exists
      if (recordSummary) {
        this._addError(Validation.messageKeys.dataImport.recordAlreadyExisting, { keyValues: keyNameValuesPairs })
        return null
      }
      const recordToInsert = Record.newRecord(user, cycle)
      const record = await RecordManager.insertRecord(user, Survey.getId(survey), recordToInsert, true, this.tx)
      this.currentRecord = await RecordManager.initNewRecord(
        { user, survey, record, createMultipleEntities: false },
        this.tx
      )

      this.insertedRecordsUuids.add(Record.getUuid(record))

      return {
        newRecord: true,
        record: this.currentRecord,
      }
    }

    // insertNewRecords === false : updating existing record

    if (!recordSummary) {
      this._addError(Validation.messageKeys.dataImport.recordNotFound, { keyValues: keyNameValuesPairs })
      return null
    }

    if (!updateRecordsInAnalysis && Record.isInAnalysisStep(recordSummary)) {
      this._addError(Validation.messageKeys.dataImport.recordInAnalysisStepCannotBeUpdated, {
        keyValues: keyNameValuesPairs,
      })
      return null
    }

    const recordUuid = Record.getUuid(recordSummary)

    // avoid loading the same record multiple times
    if (this.currentRecord?.uuid !== recordUuid) {
      this.currentRecord = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid }, this.tx)
    }
    return {
      newRecord: false,
      record: this.currentRecord,
    }
  }

  async onRowItem({ valuesByDefUuid }) {
    const { context, tx } = this
    const { survey, entityDefUuid, insertMissingNodes } = context

    const { record, newRecord } = (await this.getOrFetchRecord({ valuesByDefUuid })) || {}

    if (record) {
      try {
        const { record: recordUpdated, nodes: nodesUpdated } = await Record.updateAttributesWithValues({
          survey,
          entityDefUuid,
          valuesByDefUuid,
          insertMissingNodes,
        })(record)

        this.currentRecord = recordUpdated

        const recordUuid = Record.getUuid(this.currentRecord)

        const nodesArray = Object.values(nodesUpdated)

        if (nodesArray.length > 0) {
          await this.recordsValidationBatchPersister.addItem([recordUuid, Record.getValidation(this.currentRecord)])

          this.updatedValues += nodesArray.filter(NodeDef.isAttribute).length

          this.currentRecord = await RecordManager.persistNodesToRDB({ survey, record: recordUpdated, nodesArray }, tx)

          await this.nodesInsertBatchPersister.addItems(nodesArray.filter(Node.isCreated))
          await this.nodesUpdateBatchPersister.addItems(nodesArray.filter((node) => !Node.isCreated(node)))
        }

        // update counts
        if (newRecord) {
          this.updatedValues += Record.getNodesArray(record).length
        } else if (nodesArray.length > 0) {
          this.updatedValues += nodesArray.length
          this.updatedRecordsUuids.add(recordUuid)
        }
      } catch (e) {
        const { key, params } = e
        const errorKey = key || Validation.messageKeys.dataImport.errorUpdatingValues
        this._addError(errorKey, params)
      }
    }
    this.incrementProcessedItems()
  }

  async beforeSuccess() {
    await this.nodesInsertBatchPersister.flush()
    await this.nodesUpdateBatchPersister.flush()
    await this.recordsValidationBatchPersister.flush()

    const {
      insertedRecordsUuids,
      updatedRecordsUuids: updatedRecordsByUuid,
      processed: rowsProcessed,
      updatedValues,
    } = this

    this.setResult({
      insertedRecords: insertedRecordsUuids.size,
      updatedRecords: updatedRecordsByUuid.size,
      rowsProcessed,
      updatedValues,
    })
  }

  _addError(key, params = {}) {
    this.addError({
      error: Validation.newInstance(false, {}, [{ key, params }]),
    })
  }
}

DataImportJob.type = 'DataImportJob'
