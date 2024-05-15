import BatchPersister from '@server/db/batchPersister'
import { RdbUpdates } from '@server/modules/surveyRdb/repository/RdbUpdates'
import { NodeRdbManager } from './_recordManager/nodeRDBManager'

const BATCH_SIZE = 100

export class RdbUpdatesBatchPersister extends BatchPersister {
  constructor({ user, surveyId, tx }) {
    super(null, BATCH_SIZE, tx)
    this.user = user
    this.surveyId = surveyId
    this.rdbUpdates = new RdbUpdates()
  }

  async addItem(rdbUpdates) {
    this.rdbUpdates.merge(rdbUpdates)
    if (this.rdbUpdates.size > BATCH_SIZE) {
      await this.flush()
    }
  }

  async flush() {
    if (this.rdbUpdates.size > 0) {
      await NodeRdbManager.updateTablesFromUpdates({ rdbUpdates: this.rdbUpdates }, this.tx)
      this.rdbUpdates = new RdbUpdates()
    }
  }
}
