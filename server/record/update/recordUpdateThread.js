const RecordManager = require('../recordManager')
const messageTypes = require('./recordThreadMessageTypes')
const Thread = require('../../threads/thread')

class RecordUpdateThread extends Thread {

  onMessage (msg) {
    switch (msg.type) {
      case messageTypes.updateNode:
        this.updateNode(msg.surveyId, msg.node, msg.file)
        break
    }
  }

  updateNode (surveyId, node, file) {
    RecordManager.persistNode(surveyId, node, file)
      .then(nodes => {
        this.postMessage(nodes)
      })
  }

}

new RecordUpdateThread()