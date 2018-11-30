const path = require('path')

const WebSocketManager = require('../../webSocket/webSocketManager')
const {recordEvents} = require('../../../common/webSocket/webSocketEvents')

const ThreadsCache = require('../../threads/threadsCache')
const ThreadManager = require('../../threads/threadManager')

const recordThreadMessageTypes = require('./thread/recordThreadMessageTypes')

const recordUpdateThreads = new ThreadsCache()
const checkOutTimeoutsByUserId = {}

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
const checkIn = userId => {
  cancelCheckOut(userId)
  if (!recordUpdateThreads.getThread(userId)) {
    createRecordUpdateThread(userId)
  }
}

/**
 * Stop record update thread
 * @param userId
 */
const checkOut = userId => {
  checkOutTimeoutsByUserId[userId] = setTimeout(() => {
    const updateWorker = recordUpdateThreads.getThread(userId)
    if (updateWorker)
      updateWorker.terminate()

    delete checkOutTimeoutsByUserId[userId]
  }, 1000)
}

const cancelCheckOut = userId => {
  const timeout = checkOutTimeoutsByUserId[userId]
  if (timeout)
    clearTimeout(timeout)
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
const deleteNode = (userId, surveyId, nodeUuid) => {
  const updateWorker = recordUpdateThreads.getThread(userId)
  updateWorker.postMessage({type: recordThreadMessageTypes.deleteNode, surveyId, nodeUuid})
}

module.exports = {
  checkIn,
  checkOut,

  persistNode,
  deleteNode,
}