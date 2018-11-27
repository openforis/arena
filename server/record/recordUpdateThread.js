const {parentPort} = require('worker_threads')

const RecordManager = require('./recordManager')
const messageTypes = require('./recordThreadMessageTypes')

const updateNode = (surveyId, node, file) => {
  RecordManager.persistNode(surveyId, node, file)
    .then(nodes => {
      parentPort.postMessage(nodes)
    })
}

parentPort.on('message', function (msg) {
  switch (msg.type) {
    case messageTypes.updateNode:
      updateNode(msg.surveyId, msg.node, msg.file)
      break
    case messageTypes.disconnect:
      parentPort.close()
      break
  }
})