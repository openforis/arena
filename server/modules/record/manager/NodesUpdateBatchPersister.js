import BatchPersister from '@server/db/batchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'

const BATCH_SIZE = 10000

export class NodesUpdateBatchPersister extends BatchPersister {
  constructor({ user, surveyId, tx }) {
    super(async (nodes) => RecordManager.updateNodes({ user, surveyId, nodes }, this.tx), BATCH_SIZE)
    this.user = user
    this.surveyId = surveyId
    this.tx = tx
  }
}
