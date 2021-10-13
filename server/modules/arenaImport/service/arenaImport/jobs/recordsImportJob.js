import Job from '@server/job/job'
import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'
import * as Node from '@core/record/node'
import * as PromiseUtils from '@core/promiseUtils'

import BatchPersister from '@server/db/batchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'

import * as Record from '@core/record/record'

const NODES_INSERT_BATCH_SIZE = 10000

export default class RecordsImportJob extends Job {
  constructor(params) {
    super(RecordsImportJob.type, params)
  }

  async execute() {
    const { surveyId, survey, arenaSurveyFileZip } = this.context

    const records = await ArenaSurveyFileZip.getRecords(arenaSurveyFileZip)
    if (records.length == 0) return

    this.total = records.length

    const recordsToInsert = await Promise.all(
      records.map(async (record) => ArenaSurveyFileZip.getRecord(arenaSurveyFileZip, Record.getUuid(record)))
    )

    await RecordManager.insertRecordsInBatch(
      {
        user: this.user,
        surveyId,
        records: recordsToInsert,
        userUuid: User.getUuid(this.user),
      },
      this.tx
    )

    const batchPersister = new BatchPersister(
      async (nodes) => RecordManager.insertNodesInBatch({ surveyId, nodeValues: nodes }, this.tx),
      NODES_INSERT_BATCH_SIZE
    )

    await PromiseUtils.each(recordsToInsert, async (record) => {
      const nodes = Record.getNodes(record)
      await PromiseUtils.each(Object.values(nodes), async (node) => {
        // check that the node definition associated to the node has not been deleted from the survey
        if (Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)) {
          await batchPersister.addItem(node)
        }
      })
      this.incrementProcessedItems()
    })

    await batchPersister.flush()
  }
}

RecordsImportJob.type = 'RecordsImportJob'
