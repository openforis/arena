import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as DateUtils from '@core/dateUtils'
import * as ObjectUtils from '@core/objectUtils'
import * as PromiseUtils from '@core/promiseUtils'

import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import DataImportBaseJob from '@server/modules/dataImport/service/DataImportJob/DataImportBaseJob'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as SurveyService from '@server/modules/survey/service/surveyService'

import { ArenaMobileDataImport } from '../../arenaMobileDataImport'
import { RecordNodesUpdater } from '@core/record/_record/recordNodesUpdater'

export default class RecordsImportJob extends DataImportBaseJob {
  constructor(params) {
    super(RecordsImportJob.type, params)
  }

  async execute() {
    super.execute()

    const { arenaSurveyFileZip, surveyId } = this.context

    const recordSummaries = await ArenaSurveyFileZip.getRecords(arenaSurveyFileZip)
    this.total = recordSummaries.length

    if (this.total == 0) return

    const survey = await SurveyService.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, advanced: true })
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
      if (conflictResolutionStrategy === ArenaMobileDataImport.conflictResolutionStrategies.skipExisting) {
        // skip record
        this.logDebug(`skipping record ${recordUuid}; it already exists`)
      } else if (
        conflictResolutionStrategy === ArenaMobileDataImport.conflictResolutionStrategies.overwriteIfUpdated &&
        DateUtils.isAfter(Record.getDateModified(record), Record.getDateModified(existingRecordSummary))
      ) {
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
        const { record: recordTargetUpdated, nodes: nodesUpdated } = RecordNodesUpdater.mergeRecords({
          survey,
          recordSource: record,
          recordTarget,
        })
        this.currentRecord = recordTargetUpdated
        await this.persistUpdatedNodes({ nodesUpdated })
        this.updatedRecordsUuids.add(recordUuid)
        this.logDebug(`record update complete (${Object.values(nodesUpdated).length} nodes modified)`)
      }
    } else {
      await this.insertNewRecord(recordUuid, user, surveyId, record, tx, survey)
    }
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

    await this.persistUpdatedNodes({ nodesUpdated: nodesIndexedByUuid })

    this.insertedRecordsUuids.add(recordUuid)

    this.logDebug(`record insert complete (${nodesArray.length} nodes inserted)`)
  }
}

RecordsImportJob.type = 'RecordsImportJob'
