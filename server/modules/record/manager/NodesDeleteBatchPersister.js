import * as Node from '@core/record/node'

import BatchPersister from '@server/db/batchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'

const BATCH_SIZE = 10000

export class NodesDeleteBatchPersister extends BatchPersister {
  constructor({ user, surveyId, tx }) {
    super(
      async (nodes) =>
        RecordManager.deleteNodesByUuids(
          {
            user: this.user,
            surveyId: this.surveyId,
            nodeUuids: Object.values(nodes).map(Node.getUuid),
            systemActivity: true,
          },
          this.tx
        ),
      BATCH_SIZE,
      tx
    )
    this.user = user
    this.surveyId = surveyId
  }
}
