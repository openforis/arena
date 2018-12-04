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
    await db.tx(async t => {
      let nodes = null
      let logMessage

      switch (msg.type) {
        case messageTypes.persistNode:
          nodes = await RecordProcessor.persistNode(msg.surveyId, msg.node, msg.file, t)
          logMessage = R.omit(['user', 'type', 'surveyId'], msg)
          break
        case messageTypes.deleteNode:
          nodes = await RecordProcessor.deleteNode(msg.surveyId, msg.nodeUuid, t)
          logMessage = {nodeUuid: msg.nodeUuid}
          break
      }

      const {user, surveyId, type} = msg
      await logActivity(user, surveyId, type, logMessage, t)

      this.postMessage(nodes)
    })
  }

}

new RecordUpdateThread()