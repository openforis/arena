const RecordProcessor = require('./recordProcessor')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../../threads/thread')
const R = require('ramda')

const db = require('../../../db/db')
const {logActivity, activityType} = require('../../../activityLog/activityLogger')
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
      let logMessage, logType

      switch (msg.type) {
        case messageTypes.persistNode:
          nodes = await RecordProcessor.persistNode(msg.surveyId, msg.node, t)
          logType = activityType.record.nodePersist
          logMessage = msg.node
          break
        case messageTypes.deleteNode:
          nodes = await RecordProcessor.deleteNode(msg.surveyId, msg.nodeUuid, t)
          logType = activityType.record.nodeDelete
          logMessage = {nodeUuid: msg.nodeUuid}
          break
      }

      const {user, surveyId} = msg
      await logActivity(user, surveyId, logType, logMessage, t)

      this.postMessage(nodes)
    })
  }

}

new RecordUpdateThread()