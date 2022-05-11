import * as PromiseUtils from '@core/promiseUtils'

export default class BatchPersister {
  constructor(insertHandler, bufferSize = 1000) {
    this.insertHandler = insertHandler
    this.bufferSize = bufferSize
    this.insertBuffer = []
  }

  async addItem(item, t) {
    this.insertBuffer.push(item)

    if (this.insertBuffer.length === this.bufferSize) {
      await this.flush(t)
    }
  }

  async addItems(items, t) {
    await PromiseUtils.each(items, async (item) => this.addItem(item, t))
  }

  async flush(t) {
    if (this.insertBuffer.length > 0) {
      await this.insertHandler(this.insertBuffer, t)
      this.insertBuffer.length = 0
    }
  }
}
