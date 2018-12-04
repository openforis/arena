const RecordProcessor = require('./recordProcessor')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../threads/thread')
const R = require('ramda')

const db = require('../../../db/db')
const {logActivity} = require('../../../activityLog/activityLogger')
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
    await db.tx(async t => {
      let nodesPromise = null
      switch (msg.type) {
        case messageTypes.persistNode:
          nodesPromise = RecordProcessor.persistNode(msg.surveyId, msg.node, msg.file, t)
          break
        case messageTypes.deleteNode:
          nodesPromise = RecordProcessor.deleteNode(msg.surveyId, msg.nodeUuid, t)
          break
      }

      const {user, surveyId, type} = msg
      const logPromise = logActivity(user, surveyId, type, R.omit(['user', 'type', 'surveyId'], msg), t)

      const nodes = await nodesPromise
      await logPromise

      this.postMessage(nodes)
    })
  }

}

new RecordUpdateThread()