import { Dates } from '@openforis/arena-core'

import { ConflictResolutionStrategy } from '@common/dataImport'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as ObjectUtils from '@core/objectUtils'
import * as PromiseUtils from '@core/promiseUtils'

import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import DataImportBaseJob from '@server/modules/dataImport/service/DataImportJob/DataImportBaseJob'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as SurveyService from '@server/modules/survey/service/surveyService'

export default class RecordsImportJob extends DataImportBaseJob {
  constructor(params) {
    super(RecordsImportJob.type, params)
  }

  async execute() {
    await super.execute()

    const { context, tx } = this
    const { arenaSurveyFileZip, surveyId } = context

    const recordSummaries = await ArenaSurveyFileZip.getRecords(arenaSurveyFileZip)
    this.total = recordSummaries.length

    if (this.total == 0) return

    const survey = await SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, advanced: true }, tx)
    this.setContext({ survey })

    // import records sequentially
    await PromiseUtils.each(recordSummaries, async (recordSummary) => {
      const recordUuid = Record.getUuid(recordSummary)

      const record = await ArenaSurveyFileZip.getRecord(arenaSurveyFileZip, recordUuid)
      this.currentRecord = record

      await this.insertOrSkipRecord()

      this.incrementProcessedItems()
    })
  }

  async insertOrSkipRecord() {
    const { context, currentRecord: record, user, tx } = this
    const { survey, surveyId, conflictResolutionStrategy } = context

    const recordUuid = Record.getUuid(record)

    const existingRecordSummary = await RecordManager.fetchRecordSummary({ surveyId, recordUuid }, tx)

    if (existingRecordSummary) {
      if (conflictResolutionStrategy === ConflictResolutionStrategy.skipExisting) {
        // skip record
        this.skippedRecordsUuids.add(recordUuid)
        this.logDebug(`record ${recordUuid} skipped; it already exists`)
      } else if (
        conflictResolutionStrategy === ConflictResolutionStrategy.overwriteIfUpdated &&
        Dates.isAfter(Record.getDateModified(record), Record.getDateModified(existingRecordSummary))
      ) {
        await this.updateExistingRecord()
      }
    } else {
      await this.insertNewRecord(recordUuid, user, surveyId, record, tx, survey)
    }
  }

  async updateExistingRecord() {
    const { context, currentRecord: record, tx } = this
    const { survey, surveyId } = context

    const recordUuid = Record.getUuid(record)

    this.logDebug(`updating record ${recordUuid}`)

    const recordTarget = await RecordManager.fetchRecordAndNodesByUuid(
      {
        surveyId,
        recordUuid,
        draft: false,
        fetchForUpdate: true,
      },
      tx
    )
    const { record: recordTargetUpdated, nodes: nodesUpdated } = await Record.replaceUpdatedNodes({
      survey,
      recordSource: record,
      sideEffect: true,
    })(recordTarget)
    this.currentRecord = recordTargetUpdated

    await this.persistUpdatedNodes({ nodesUpdated, dateModified: Record.getDateModified(record) })

    this.updatedRecordsUuids.add(recordUuid)
    this.logDebug(`record update complete (${Object.values(nodesUpdated).length} nodes modified)`)
  }

  async insertNewRecord() {
    const { context, user, currentRecord: record, tx } = this
    const { survey, surveyId } = context

    const recordUuid = Record.getUuid(record)
    this.logDebug(`inserting new record ${recordUuid}`)

    await RecordManager.insertRecord(user, surveyId, record, true, tx)

    // insert nodes (add them to batch persister)
    const nodesArray = Record.getNodesArray(record)
      // check that the node definition associated to the node has not been deleted from the survey
      .filter((node) => !!Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey))
      .sort((nodeA, nodeB) => nodeA.id - nodeB.id)
      .map((node) => {
        node[Node.keys.created] = true // do side effect to avoid creating new objects
        return node
      })
    const nodesIndexedByUuid = ObjectUtils.toUuidIndexedObj(nodesArray)

    await this.persistUpdatedNodes({ nodesUpdated: nodesIndexedByUuid, dateModified: Record.getDateModified(record) })

    this.insertedRecordsUuids.add(recordUuid)

    this.logDebug(`record insert complete (${nodesArray.length} nodes inserted)`)
  }

  generateResult() {
    const result = super.generateResult()
    result['updatedRecordsUuids'] = Array.from(this.updatedRecordsUuids) // it will be used to refresh records in update threads
    return result
  }
}

RecordsImportJob.type = 'RecordsImportJob'