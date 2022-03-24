import BatchPersister from '@server/db/batchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'

const BATCH_SIZE = 10000

export class NodesInsertBatchPersister extends BatchPersister {
  constructor({ user, surveyId, tx }) {
    super(
      async (nodes) =>
        RecordManager.insertNodesInBatch(
          { user: this.user, surveyId: this.surveyId, nodes, systemActivity: true },
          this.tx
        ),
      BATCH_SIZE
    )
    this.user = user
    this.surveyId = surveyId
    this.tx = tx
  }
}
