const db = require('../../../db/db')
const RecordProcessor = require('./recordProcessor')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../threads/thread')

const Queue = require('../../../../common/queue')
const DataSchema = require('../../../surveyData/dataSchema')

class RecordUpdateThread extends Thread {

  constructor () {
    super()
    this.queue = new Queue()
    this.processing = false
  }

  onMessage (msg) {
    this.queue.enqueue(msg)
    this.processNext()
      .then(() => {})
  }

  async processNext () {
    if (!(this.processing || this.queue.isEmpty())) {

      this.processing = true

      const msg = this.queue.dequeue()
      await this.processMessage(msg)

      this.processing = false

      await this.processNext()
    }
  }

  async processMessage (msg) {
    let nodes = null

    await db.tx(async t => {
      const {surveyId} = msg

      switch (msg.type) {
        case messageTypes.persistNode:
          nodes = await RecordProcessor.persistNode(surveyId, msg.node, msg.file, t)
          break

        case messageTypes.deleteNode:
          nodes = await RecordProcessor.deleteNode(surveyId, msg.nodeUuid, t)
          break
      }

      this.postMessage(nodes)

      await DataSchema.updateTableNodes(msg.surveyId, nodes, t)
    })
  }

}

new RecordUpdateThread()