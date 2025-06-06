import * as Record from '@core/record/record'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { ItemsCache } from './ItemsCache'

export class RecordsProvider {
  constructor({ surveyId, tx, maxItems = 100, maxTotalItemsSize = 10000 }) {
    this.surveyId = surveyId
    this.tx = tx
    this._recordsCache = new ItemsCache({ maxItems, maxTotalItemsSize })
  }

  async getOrFetch(recordUuid) {
    const { surveyId, tx } = this
    let record = this._recordsCache.get(recordUuid)

    if (!record) {
      record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid }, tx)
      this.add(record)
    }
    return record
  }

  add(record) {
    this._recordsCache.add(Record.getUuid(record), record, Record.getNodesArray(record).length)
  }
}
