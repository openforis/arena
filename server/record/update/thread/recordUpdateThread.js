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
      const {user, surveyId} = msg

      switch (msg.type) {
        case messageTypes.createRecord:
          nodes = await RecordProcessor.createRecord(user, surveyId, msg.record, t)
          break
        case messageTypes.persistNode:
          nodes = await RecordProcessor.persistNode(user, surveyId, msg.node, t)
          break
        case messageTypes.deleteNode:
          nodes = await RecordProcessor.deleteNode(user, surveyId, msg.nodeUuid, t)
          break
      }

      this.postMessage(nodes)

      try {
        await DataSchema.updateTableNodes(surveyId, nodes, t)
      } catch (e) {
        console.log("error updating survey data schema", e)
      }
    })
  }

}

new RecordUpdateThread()