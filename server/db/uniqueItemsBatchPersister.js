export default class UniqueItemsBatchPersister {
  constructor(insertHandler, bufferSize = 1000, tx = null) {
    this.insertHandler = insertHandler
    this.bufferSize = bufferSize
    this.itemsToInsertByKey = {}
    this.tx = tx
  }

  async addItem(key, item) {
    this.itemsToInsertByKey[key] = item

    if (Object.keys(this.itemsToInsertByKey).length === this.bufferSize) {
      await this.flush()
    }
  }

  async addItems(itemsByKey) {
    for await (const [key, item] of Object.entries(itemsByKey)) {
      await this.addItem(key, item)
    }
  }

  async flush() {
    const entries = Object.entries(this.itemsToInsertByKey)
    if (entries.length > 0) {
      await this.insertHandler(entries, this.tx)
      this.itemsToInsertByKey = {}
    }
  }
}
