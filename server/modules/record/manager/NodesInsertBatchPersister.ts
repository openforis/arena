import type { User as ArenaUser } from '@openforis/arena-core'
import BatchPersister from '@server/db/batchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'

const BATCH_SIZE = 10000

export class NodesInsertBatchPersister extends BatchPersister {
  surveyId: number
  user: ArenaUser

  constructor({ user, surveyId, tx }) {
    super(
      (nodes) =>
        RecordManager.insertNodesInBatch(
          { user: this.user, surveyId: this.surveyId, nodes, systemActivity: true },
          this.tx
        ),
      BATCH_SIZE,
      tx
    )
    this.user = user
    this.surveyId = surveyId
  }
}
