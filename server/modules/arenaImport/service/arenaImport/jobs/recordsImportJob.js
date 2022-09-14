import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as User from '@core/user/user'
import * as Validation from '@core/validation/validation'
import * as DateUtils from '@core/dateUtils'
import * as PromiseUtils from '@core/promiseUtils'

import Job from '@server/job/job'
import BatchPersister from '@server/db/batchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as ActivityLogManager from '@server/modules/activityLog/manager/activityLogManager'

import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'

const NODES_INSERT_BATCH_SIZE = 10000

export default class RecordsImportJob extends Job {
  constructor(params) {
    super(RecordsImportJob.type, params)
  }

  async execute() {
    const {
      surveyId: _surveyId,
      survey,
      arenaSurveyFileZip,
      includingUsers,
      userUuidNewByUserUuid,
      mobile,
    } = this.context
    const surveyId = mobile ? Survey.getId(survey) : _surveyId

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
      let record = await ArenaSurveyFileZip.getRecord(arenaSurveyFileZip, recordUuid)
      if (!mobile) {
        const ownerUuid = includingUsers
          ? // user uuid in the db could be different by the one being imported (see UsersImportJob)
            userUuidNewByUserUuid[Record.getOwnerUuid(record)]
          : // ignore owner in imported file; consider current user as owner
            User.getUuid(this.user)
        record = Record.assocOwnerUuid(ownerUuid)(record)
      }

      const recordToStore = this.prepareRecordToStore(record)

      await this.insertOrSkipRecord({ record: recordToStore, nodesBatchPersister })

      this.incrementProcessedItems()
    })

    await nodesBatchPersister.flush()
  }

  async insertOrSkipRecord({ record, nodesBatchPersister }) {
    const { mobile, survey, surveyId } = this.context

    const recordUuid = Record.getUuid(record)

    const existingRecord = mobile ? await RecordManager.fetchRecordSummary({ surveyId, recordUuid }, this.tx) : null

    if (!existingRecord || DateUtils.isAfter(Record.getDateModified(record), Record.getDateModified(existingRecord))) {
      if (existingRecord) {
        // delete existing record before import (if the record to import has more recent changes)
        this.logDebug(`deleting existing record ${recordUuid}`)
        await RecordManager.deleteRecord(this.user, survey, existingRecord, this.tx)
      }
      // insert record
      await RecordManager.insertRecord(this.user, surveyId, record, true, this.tx)

      // insert nodes (add them to batch persister)
      await PromiseUtils.each(Record.getNodesArray(record), async (node) => {
        // check that the node definition associated to the node has not been deleted from the survey
        if (Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)) {
          await nodesBatchPersister.addItem(node)
        }
      })
    } else {
      this.logDebug(`skipping record ${recordUuid}; it doesn't have any recent updates`)
    }
  }

  /**
   * Removes properties in the record object that don't need to be stored and logged in the activity log.
   *
   * @param {!object} record - The record to cleanup.
   * @returns {object} - The cleaned up record.
   */
  prepareRecordToStore(record) {
    let recordUpdated = Record.dissocNodes(record)
    if (Validation.isObjValid(recordUpdated)) {
      recordUpdated = Validation.dissocValidation(recordUpdated)
    }
    const maxNodeModifiedDate = new Date(Math.max.apply(null, Record.getNodesArray(record).map(Record.getDateModified)))
    recordUpdated = Record.assocDateModified(maxNodeModifiedDate)(recordUpdated)
    return recordUpdated
  }
}

RecordsImportJob.type = 'RecordsImportJob'
