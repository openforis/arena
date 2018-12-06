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
      .then(() => {
      })
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
      case messageTypes.persistNode:
        nodes = await RecordProcessor.persistNode(msg.user, msg.surveyId, msg.node)
        break
      case messageTypes.deleteNode:
        nodes = await RecordProcessor.deleteNode(msg.user, msg.surveyId, msg.nodeUuid)
        break
      case messageTypes.createRecord:
        nodes = await RecordProcessor.createRecord(msg.user, msg.record)

    }

    this.postMessage(nodes)
  }

}

new RecordUpdateThread()