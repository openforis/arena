import * as Record from '@core/record/record'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { ItemsCache } from './ItemsCache'

export class RecordsProvider {
  constructor({ surveyId, tx }) {
    this.surveyId = surveyId
    this.tx = tx
    this._recordsCache = new ItemsCache()
  }

  async getOrFetch(recordUuid) {
    const { surveyId, tx } = this
    let record = this._recordsCache.get(recordUuid)

    if (!record) {
      record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid }, tx)
      this._recordsCache.add(recordUuid, record)
    }
    return record
  }

  add(record) {
    this._recordsCache.add(Record.getUuid(record), record)
  }
}
