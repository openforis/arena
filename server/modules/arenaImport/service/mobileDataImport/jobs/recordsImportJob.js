import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import BatchPersister from '@server/db/batchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'

import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import FileZip from '@server/utils/file/fileZip'

const NODES_INSERT_BATCH_SIZE = 10000

export default class RecordsImportJob extends Job {
  constructor(params) {
    super(RecordsImportJob.type, params)
  }

  async execute() {
    const { filePath, survey } = this.context
    const surveyId = Survey.getId(survey)

    const arenaSurveyFileZip = new FileZip(filePath)
    await arenaSurveyFileZip.init()

    const recordSummaries = await ArenaSurveyFileZip.getRecords(arenaSurveyFileZip)
    this.total = recordSummaries.length

    if (this.total == 0) return

    // use a batch persister to persist nodes in batch
    const nodesBatchPersister = new BatchPersister(
      async (nodes) =>
        RecordManager.insertNodesInBatch({ user: this.user, surveyId, nodes, systemActivity: true }, this.tx),
      NODES_INSERT_BATCH_SIZE
    )

    // import records sequentially
    await PromiseUtils.each(recordSummaries, async (recordSummary) => {
      const recordUuid = Record.getUuid(recordSummary)

      // insert activity log
      await ActivityLogManager.insert(
        this.user,
        surveyId,
        ActivityLog.type.recordImport,
        { recordUuid },
        false,
        this.tx
      )

      // insert record
      const record = await ArenaSurveyFileZip.getRecord(arenaSurveyFileZip, recordUuid)

      await this.insertOrSkipRecord({ record, nodesBatchPersister })

      this.incrementProcessedItems()
    })

    await nodesBatchPersister.flush()
  }

  async insertOrSkipRecord({ record, nodesBatchPersister }) {
    const { survey } = this.context

    const surveyId = Survey.getId(survey)

    const recordUuid = Record.getUuid(record)

    const recordSummary = this.prepareRecordSummaryToStore(record)

    const existingRecordSummary = await RecordManager.fetchRecordSummary({ surveyId, recordUuid }, this.tx)

    if (existingRecordSummary) {
      // skip record
      // TODO update record
      this.logDebug(`skipping record ${recordUuid}; it already exists`)
      return
    }

    // if (
    //   !existingRecordSummary ||
    //   DateUtils.isAfter(Record.getDateModified(recordSummary), Record.getDateModified(existingRecordSummary))
    // ) {
    // if (existingRecordSummary) {
    //   // delete existing record before import (if the record to import has more recent changes)
    //   this.logDebug(`deleting existing record ${recordUuid}`)
    //   await RecordManager.deleteRecord(this.user, survey, existingRecordSummary, this.tx)
    // }
    // insert record
    await RecordManager.insertRecord(this.user, surveyId, recordSummary, true, this.tx)

    // insert nodes (add them to batch persister)
    const nodes = Record.getNodesArray(record).sort((nodeA, nodeB) => nodeA.id - nodeB.id)
    await PromiseUtils.each(nodes, async (node) => {
      // check that the node definition associated to the node has not been deleted from the survey
      if (Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)) {
        await nodesBatchPersister.addItem(node)
      }
    })
    // } else {
    //   this.logDebug(`skipping record ${recordUuid}; it doesn't have any recent updates`)
    // }
  }

  /**
   * Updates the record modified date using the max modified date of the nodes.
   *
   * @param {!object} record - The record object.
   * @returns {object} - The modified record.
   */
  prepareRecordSummaryToStore(record) {
    const maxNodeModifiedDate = new Date(Math.max.apply(null, Record.getNodesArray(record).map(Record.getDateModified)))
    return Record.assocDateModified(maxNodeModifiedDate)(record)
  }
}

RecordsImportJob.type = 'RecordsImportJob'
