import type { ArenaRecord } from '@openforis/arena-core'

import type { DbClient } from '@server/db/db'
import * as Record from '@core/record/record'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { ItemsCache } from './ItemsCache'

export class RecordsProvider {
  _recordsCache: ItemsCache<ArenaRecord>
  surveyId: number
  tx: DbClient

  constructor({
    surveyId,
    tx,
    maxItems = 100,
    maxTotalItemsSize = 10000,
  }: {
    surveyId: number
    tx: DbClient
    maxItems?: number
    maxTotalItemsSize?: number
  }) {
    this.surveyId = surveyId
    this.tx = tx
    this._recordsCache = new ItemsCache({ maxItems, maxTotalItemsSize })
  }

  async getOrFetch(recordUuid: string): Promise<ArenaRecord> {
    const { surveyId, tx } = this
    let record = this._recordsCache.get(recordUuid)

    if (!record) {
      record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid }, tx)
      this.add(record)
    }
    return record
  }

  add(record: ArenaRecord): void {
    this._recordsCache.add(Record.getUuid(record), record, Record.getNodesArray(record).length)
  }
}
