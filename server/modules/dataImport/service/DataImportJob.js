import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import { NodeValues } from '@core/record/nodeValues'
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

    const reader = await DataImportFileReader.createReader({
      filePath,
      survey,
      entityDefUuid,
      onRowItem: (item) => this.onRowItem(item),
      onTotalChange: (total) => (this.total = total),
    })

    await reader.start()
  }

  async getOrFetchRecord({ valuesByDefUuid }) {
    const { user } = this
    const { cycle, insertNewRecords, recordsSummary, survey } = this.context

    // fetch record by root entity key values
    const rootKeyDefs = Survey.getNodeDefRootKeys(survey)
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
    const keyValues = rootKeyDefs
      .map((rootKeyDef) => {
        const keyValueInRow = valuesByDefUuid[NodeDef.getUuid(rootKeyDef)]
        return JSON.stringify(keyValueInRow)
      })
      .join(',')

    if (insertNewRecords) {
      // check if record with the same key values already exists
      if (recordSummary) {
        this.addError({
          error: Validation.newInstance(false, {}, [
            { key: Validation.messageKeys.dataImport.recordAlreadyExisting, params: { keyValues } },
          ]),
        })
        return null
      }
      const recordToInsert = Record.newRecord(user, cycle)
      const record = await RecordManager.insertRecord(user, Survey.getId(survey), recordToInsert, true, this.tx)
      this.currentRecord = await RecordManager.initNewRecord({ user, survey, record }, this.tx)
      return this.currentRecord
    }

    // insertNewRecords === false : updating existing record

    if (!recordSummary) {
      this.addError({
        error: Validation.newInstance(false, {}, [
          { key: Validation.messageKeys.dataImport.recordNotFound, params: { keyValues } },
        ]),
      })
      return null
    }

    const recordUuid = Record.getUuid(recordSummary)

    // avoid loading the same record multiple times
    if (this.currentRecord?.uuid !== recordUuid) {
      this.currentRecord = await RecordManager.fetchRecordAndNodesByUuid(
        { surveyId: this.surveyId, recordUuid, draft: false },
        this.tx
      )
    }
    return this.currentRecord
  }

  async onRowItem({ valuesByDefUuid }) {
    const { survey, entityDefUuid } = this.context

    const record = await this.getOrFetchRecord({ valuesByDefUuid })
    if (record) {
      const { record: recordUpdated, nodes: nodesUpdated } = await Record.updateAttributesWithValues({
        survey,
        entityDefUuid,
        valuesByDefUuid,
      })(record)

      this.currentRecord = recordUpdated

      await this.recordsValidationBatchPersister.addItem([
        Record.getUuid(this.currentRecord),
        Record.getValidation(this.currentRecord),
      ])
      const nodesArray = Object.values(nodesUpdated)
      nodesArray.sort((nodeA, nodeB) => Node.getHierarchy(nodeA).length - Node.getHierarchy(nodeB).length)
      await this.nodesInsertBatchPersister.addItems(nodesArray.filter(Node.isCreated))
      await this.nodesUpdateBatchPersister.addItems(nodesArray.filter((node) => !Node.isCreated(node)))
    }
    this.incrementProcessedItems()
  }

  async beforeEnd() {
    if (this.isRunning()) {
      await this.recordsValidationBatchPersister.flush()
      await this.nodesInsertBatchPersister.flush()
      await this.nodesUpdateBatchPersister.flush()
    }
  }
}

DataImportJob.type = 'DataImportJob'
