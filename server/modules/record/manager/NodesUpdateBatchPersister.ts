import type { ArenaUser } from '@openforis/arena-core'
import BatchPersister from '@server/db/batchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'

const BATCH_SIZE = 10000

export class NodesUpdateBatchPersister extends BatchPersister {
  surveyId: number
  user: ArenaUser

  constructor({ user, surveyId, tx }) {
    super((nodes) => RecordManager.updateNodes({ user, surveyId, nodes }, this.tx), BATCH_SIZE, tx)
    this.user = user
    this.surveyId = surveyId
  }
}
