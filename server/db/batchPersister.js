import * as PromiseUtils from '@core/promiseUtils'

export default class BatchPersister {
  constructor(insertHandler, bufferSize = 1000, tx = null) {
    this.insertHandler = insertHandler
    this.bufferSize = bufferSize
    this.insertBuffer = []
    this.tx = tx
  }

  async addItem(item, t = null) {
    this.insertBuffer.push(item)

    if (this.insertBuffer.length === this.bufferSize) {
      const tx = t || this.tx
      await this.flush(tx)
    }
  }

  async addItems(items, t = null) {
    const tx = t || this.tx
    await PromiseUtils.each(items, async (item) => this.addItem(item, tx))
  }

  async flush(t = null) {
    if (this.insertBuffer.length > 0) {
      const tx = t || this.tx
      await this.insertHandler(this.insertBuffer, tx)
      this.insertBuffer.length = 0
    }
  }
}
