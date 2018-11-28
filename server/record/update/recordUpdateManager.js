const path = require('path')

const WebSocketManager = require('../../webSocket/webSocketManager')
const {recordEvents} = require('../../../common/webSocket/webSocketEvents')

const ThreadsCache = require('../../threads/threadsCache')
const ThreadManager = require('../../threads/threadManager')

const recordThreadMessageTypes = require('./thread/recordThreadMessageTypes')

const recordUpdateThreads = new ThreadsCache()

const createRecordUpdateThread = (userId) => {
  const thread = new ThreadManager(
    path.resolve(__dirname, 'thread', 'recordUpdateThread.js'),
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
  updateWorker.postMessage({type: recordThreadMessageTypes.persistNode, surveyId, node, file})
}

/**
 * Notify thread to delete a node
 *
 * @param userId
 * @param surveyId
 * @param nodeUUID
 */
const deleteNode = (userId, surveyId, nodeUUID) => {
  const updateWorker = recordUpdateThreads.getThread(userId)
  updateWorker.postMessage({type: recordThreadMessageTypes.deleteNode, surveyId, nodeUUID})
}

module.exports = {
  checkIn,
  checkOut,

  persistNode,
  deleteNode,
}