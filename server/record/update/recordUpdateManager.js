const path = require('path')

const WebSocketManager = require('../../webSocket/webSocketManager')
const {recordEvents} = require('../../../common/webSocket/webSocketEvents')

const ThreadsCache = require('../../threads/threadsCache')
const ThreadManager = require('../../threads/threadManager')

const recordThreadMessageTypes = require('./recordThreadMessageTypes')

const recordUpdateThreads = new ThreadsCache()

const createRecordUpdateThread = (userId) => {
  const thread = new ThreadManager(
    path.resolve(__dirname, 'recordUpdateThread.js'),
    {},
    nodes => WebSocketManager.notifyUser(userId, recordEvents.nodesUpdate, nodes),
    () => recordUpdateThreads.removeThread(userId)
  )

  recordUpdateThreads.putThread(userId, thread)

  return thread
}

/**
 * Start record update thread
 * @param userId
 */
const checkIn = createRecordUpdateThread

/**
 * Stop record update thread
 * @param userId
 */
const checkOut = userId => {
  const updateWorker = recordUpdateThreads.getThread(userId)
  updateWorker.terminate()
}

/**
 * Notify thread to create or update a node
 *
 * @param userId
 * @param surveyId
 * @param node
 * @param file
 */
const persistNode = (userId, surveyId, node, file) => {
  const updateWorker = recordUpdateThreads.getThread(userId)

  updateWorker.postMessage({type: recordThreadMessageTypes.updateNode, surveyId, node, file})

}
module.exports = {
  checkIn,
  checkOut,
  persistNode,
}