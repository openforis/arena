const RecordProcessor = require('./recordProcessor')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../threads/thread')

const Queue = require('../../../../common/queue')

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

    switch (msg.type) {
      case messageTypes.updateNode:
        nodes = await RecordProcessor.persistNode(msg.surveyId, msg.node, msg.file)
        break

      case messageTypes.deleteNode:
        nodes = await RecordProcessor.deleteNode(msg.surveyId, msg.nodeUUID)
        break
    }

    this.postMessage(nodes)
  }

}

new RecordUpdateThread()