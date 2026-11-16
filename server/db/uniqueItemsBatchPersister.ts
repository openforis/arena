import type { DbClient } from './db'

type InsertHandler<T> = (entries: [string, T][], tx: DbClient | null) => Promise<unknown>

// buffers the items (one per key) and inserts them in batches
export default class UniqueItemsBatchPersister<T = any> {
  readonly insertHandler: InsertHandler<T>
  readonly bufferSize: number
  itemsToInsertByKey: Record<string, T>
  readonly tx: DbClient | null

  constructor(insertHandler: InsertHandler<T>, bufferSize = 1000, tx: DbClient | null = null) {
    this.insertHandler = insertHandler
    this.bufferSize = bufferSize
    this.itemsToInsertByKey = {}
    this.tx = tx
  }

  async addItem(key: string, item: T): Promise<void> {
    this.itemsToInsertByKey[key] = item

    if (Object.keys(this.itemsToInsertByKey).length === this.bufferSize) {
      await this.flush()
    }
  }

  async addItems(itemsByKey: Record<string, T>): Promise<void> {
    for (const [key, item] of Object.entries(itemsByKey)) {
      await this.addItem(key, item) // NOSONAR
    }
  }

  async flush(): Promise<void> {
    const entries = Object.entries(this.itemsToInsertByKey)
    if (entries.length > 0) {
      await this.insertHandler(entries, this.tx)
      this.itemsToInsertByKey = {}
    }
  }
}
