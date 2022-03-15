import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import { NodeValues } from '@core/record/nodeValues'

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

    await this.fetchSurveyAndRecordsSummary()

    await this.startCsvReader()
  }

  async fetchSurveyAndRecordsSummary() {
    const { surveyId, tx } = this
    const { cycle } = this.context

    // fetch survey
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, cycle, draft: false, advanced: true },
      tx
    )

    // fetch all records summary once to make the record fetch faster
    const recordsSummary = await RecordManager.fetchRecordsSummaryBySurveyId({
      surveyId,
      cycle,
      offset: 0,
      limit: null,
    })

    this.setContext({
      survey,
      recordsSummary: recordsSummary.list,
    })
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
    const { recordsSummary, survey } = this.context

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
    if (recordSummary) {
      const recordUuid = Record.getUuid(recordSummary)

      // avoid loading the same record multiple times
      if (this.currentRecord?.uuid !== recordUuid) {
        this.currentRecord = await RecordManager.fetchRecordAndNodesByUuid(
          { surveyId: this.surveyId, recordUuid, draft: false },
          this.tx
        )
      }
    } else {
      const keyValuesText = rootKeyDefs
        .map((rootKeyDef) => {
          const keyValueInRow = valuesByDefUuid[NodeDef.getUuid(rootKeyDef)]
          return JSON.stringify(keyValueInRow)
        })
        .join(',')
      throw new Error(`Record with keys ${keyValuesText} not found`)
    }
    return this.currentRecord
  }

  async onRowItem({ valuesByDefUuid }) {
    const { survey, entityDefUuid, insertNewRecords } = this.context

    const record = await this.getOrFetchRecord({ valuesByDefUuid })

    if (insertNewRecords) {
      // handle inserting new records
      if (NodeDef.getUuid(Survey.getNodeDefRoot(survey)) !== entityDefUuid) {
        throw new Error('New records can be inserted only selecting the root entity definition')
      }
    } else {
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
