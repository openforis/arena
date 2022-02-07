import Job from '@server/job/job'
import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as User from '@core/user/user'
import * as PromiseUtils from '@core/promiseUtils'

import BatchPersister from '@server/db/batchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'

const NODES_INSERT_BATCH_SIZE = 10000

export default class RecordsImportJob extends Job {
  constructor(params) {
    super(RecordsImportJob.type, params)
  }

  async execute() {
    const { surveyId, survey, arenaSurveyFileZip, includingUsers, userUuidNewByUserUuid } = this.context

    const recordSummaries = await ArenaSurveyFileZip.getRecords(arenaSurveyFileZip)
    this.total = recordSummaries.length

    if (this.total == 0) return

    // use a batch persister to persist nodes in batch
    const nodesBatchPersister = new BatchPersister(
      async (nodes) => RecordManager.insertNodesInBatch({ surveyId, nodeValues: nodes }, this.tx),
      NODES_INSERT_BATCH_SIZE
    )

    // import records sequentially
    await PromiseUtils.each(recordSummaries, async (recordSummary) => {
      // insert record
      let record = await ArenaSurveyFileZip.getRecord(arenaSurveyFileZip, Record.getUuid(recordSummary))
      const ownerUuid = includingUsers
        ? // user uuid in the db could be different by the one being imported (see UsersImportJob)
          userUuidNewByUserUuid[Record.getOwnerUuid(record)]
        : // ignore owner in imported file; consider current user as owner
          User.getUuid(this.user)
      record = Record.assocOwnerUuid(ownerUuid)(record)
      await RecordManager.insertRecord(this.user, surveyId, record, false, this.tx)

      // insert nodes (add them to batch persister)
      const nodes = Record.getNodes(record)
      await PromiseUtils.each(Object.values(nodes), async (node) => {
        // check that the node definition associated to the node has not been deleted from the survey
        if (Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)) {
          await nodesBatchPersister.addItem(node)
        }
      })
      this.incrementProcessedItems()
    })

    await nodesBatchPersister.flush()
  }
}

RecordsImportJob.type = 'RecordsImportJob'
