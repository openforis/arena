const RecordManager = require('../recordManager')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../threads/thread')

const Queue = require('../../../common/queue')

//TODO move  RecordManager.persistNode / RecordManager.deleteNode

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

      switch (msg.type) {
        case messageTypes.updateNode:
          await this.updateNode(msg.surveyId, msg.node, msg.file)
          break
      }

      this.processing = false

      await this.processNext()
    }
  }

  async updateNode (surveyId, node, file) {
    const nodes = await RecordManager.persistNode(surveyId, node, file)

    this.postMessage(nodes)
  }

}

new RecordUpdateThread()