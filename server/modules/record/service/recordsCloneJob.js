import { Objects, Promises, RecordUuidsUpdater, SystemError } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as RecordFile from '@core/record/recordFile'
import * as Node from '@core/record/node'

import Job from '@server/job/job'
import * as FileService from '@server/modules/record/service/fileService'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as DataTableUpdateRepository from '@server/modules/surveyRdb/repository/dataTableUpdateRepository'

import { NodesInsertBatchPersister } from '../manager/NodesInsertBatchPersister'

export default class RecordsCloneJob extends Job {
  constructor(params) {
    super(RecordsCloneJob.type, params)
  }

  async onStart() {
    await super.onStart()

    const { context, user, tx } = this
    const { surveyId } = context
    this.nodesInsertBatchPersister = new NodesInsertBatchPersister({ user, surveyId, tx })
  }

  async execute() {
    const recordsToClone = await this.findRecordsToClone()

    this.total = recordsToClone.length

    await Promises.each(recordsToClone, async (recordSummary) => this.cloneRecord({ recordSummary }))
  }

  async beforeSuccess() {
    await super.beforeSuccess()
    await this.nodesInsertBatchPersister.flush()
  }

  async findRecordsToClone() {
    const { context } = this
    const { surveyId, cycleFrom, cycleTo, recordsUuids } = context

    const { nodeDefKeys: nodeDefKeysCycleFrom, list: recordsCycleFrom } =
      await RecordManager.fetchRecordsSummaryBySurveyId({ surveyId, cycle: cycleFrom })
    const { nodeDefKeys: nodeDefKeysCycleTo, list: recordsCycleTo } = await RecordManager.fetchRecordsSummaryBySurveyId(
      { surveyId, cycle: cycleTo }
    )

    if (!Objects.isEqual(nodeDefKeysCycleFrom, nodeDefKeysCycleTo)) {
      throw new SystemError('validationErrors.recordClone.differentKeyAttributes')
    }

    const keys = nodeDefKeysCycleFrom.map((nodeDefKey) => A.camelize(NodeDef.getName(nodeDefKey)))
    const getKeyValues = (recordSummary) => keys.map((key) => recordSummary[key])

    const recordsToClone = recordsCycleFrom.filter((recordCycleFrom) => {
      if (!Objects.isEmpty(recordsUuids) && !recordsUuids.includes(Record.getUuid(recordCycleFrom))) {
        return false
      }
      const keyValuesRecordCycleFrom = getKeyValues(recordCycleFrom)
      return !recordsCycleTo.some((recordCycleTo) =>
        Objects.isEqual(keyValuesRecordCycleFrom, getKeyValues(recordCycleTo))
      )
    })
    return recordsToClone
  }

  async cloneRecord({ recordSummary }) {
    const { context, tx, user } = this
    const { surveyId, cycleTo } = context

    const record = await RecordManager.fetchRecordAndNodesByUuid({
      surveyId,
      recordUuid: recordSummary.uuid,
      fetchForUpdate: false,
    })
    record.cycle = cycleTo

    // assign new UUIDs with side effect on record and nodes, faster when record is big
    const { newNodeUuidsByOldUuid, newFileUuidsByOldUuid } = RecordUuidsUpdater.assignNewUuids(record)

    const newRecordUuid = Record.getUuid(record)
    const nodesArray = Record.getNodesArray(record)

    // insert record
    await RecordManager.insertRecord(user, surveyId, record, true, tx)

    // insert nodes (add them to batch persister)
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId }, tx)

    await Promises.each(nodesArray, async (node) => {
      // check that the node definition associated to the node has not been deleted from the survey
      if (Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)) {
        await this.nodesInsertBatchPersister.addItem(node)
      }
    })

    // update RDB
    await DataTableUpdateRepository.updateTables({ survey, record, nodes: Record.getNodes(record) }, tx)

    await this.cloneFiles({ newFileUuidsByOldUuid, newNodeUuidsByOldUuid, newRecordUuid })

    this.incrementProcessedItems()
  }

  async cloneFiles({ newFileUuidsByOldUuid, newNodeUuidsByOldUuid, newRecordUuid }) {
    const { context, tx } = this
    const { surveyId } = context

    for await (const [fileUuid, newFileUuid] of Object.entries(newFileUuidsByOldUuid)) {
      const fileSummary = await FileService.fetchFileSummaryByUuid(surveyId, fileUuid, tx)
      if (fileSummary) {
        const content = await FileService.fetchFileContentAsBuffer({ surveyId, fileUuid }, tx)
        const oldNodeUuid = RecordFile.getNodeUuid(fileSummary)
        const newNodeUuid = oldNodeUuid ? newNodeUuidsByOldUuid[oldNodeUuid] : null
        const newFile = RecordFile.createFile({
          content,
          name: RecordFile.getName(fileSummary),
          nodeUuid: newNodeUuid,
          recordUuid: newRecordUuid,
          size: RecordFile.getSize(fileSummary),
          uuid: newFileUuid,
        })
        await FileService.insertFile(surveyId, newFile, tx)
      }
    }
  }
}

RecordsCloneJob.type = 'RecordsCloneJob'
