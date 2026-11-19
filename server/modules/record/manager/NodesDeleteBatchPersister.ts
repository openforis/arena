import type { ArenaUser } from '@openforis/arena-core'
import * as Node from '@core/record/node'

import BatchPersister from '@server/db/batchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'

const BATCH_SIZE = 10000

export class NodesDeleteBatchPersister extends BatchPersister {
  surveyId: number
  user: ArenaUser

  constructor({ user, surveyId, tx }) {
    super(
      (nodes) =>
        RecordManager.deleteNodesByUuids(
          {
            user: this.user,
            surveyId: this.surveyId,
            nodeUuids: nodes.map(Node.getUuid),
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
