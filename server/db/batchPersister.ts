import type { DbClient } from './db'

type InsertHandler<T> = (items: T[], tx: DbClient | null) => Promise<unknown>

// buffers the items and inserts them in batches
export default class BatchPersister<T = any> {
  readonly insertHandler: InsertHandler<T>
  readonly bufferSize: number
  readonly insertBuffer: T[]
  readonly tx: DbClient | null

  constructor(insertHandler: InsertHandler<T>, bufferSize = 1000, tx: DbClient | null = null) {
    this.insertHandler = insertHandler
    this.bufferSize = bufferSize
    this.insertBuffer = []
    this.tx = tx
  }

  async addItem(item: T, t: DbClient | null = null): Promise<void> {
    this.insertBuffer.push(item)

    if (this.insertBuffer.length === this.bufferSize) {
      const tx = t || this.tx
      await this.flush(tx)
    }
  }

  async addItems(items: T[], t: DbClient | null = null): Promise<void> {
    const tx = t || this.tx
    for (const item of items) {
      await this.addItem(item, tx) // NOSONAR
    }
  }

  async flush(t: DbClient | null = null): Promise<void> {
    if (this.insertBuffer.length > 0) {
      const tx = t || this.tx
      await this.insertHandler(this.insertBuffer, tx)
      this.insertBuffer.length = 0
    }
  }
}
