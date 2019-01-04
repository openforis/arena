const path = require('path')

const WebSocketManager = require('../../webSocket/webSocketManager')
const WebSocketEvents = require('../../../common/webSocket/webSocketEvents')

const ThreadsCache = require('../../threads/threadsCache')
const ThreadManager = require('../../threads/threadManager')

const recordThreadMessageTypes = require('./thread/recordThreadMessageTypes')

const recordUpdateThreads = new ThreadsCache()
const checkOutTimeoutsByUserId = {}

// const RecordProcessor = require('./thread/recordProcessor')
const RecordUpdateThread = require('./thread/recordUpdateThread')

const createRecordUpdateThread = (user, surveyId, preview) => {
  const userId = user.id
  const thread = new ThreadManager(
    path.resolve(__dirname, 'thread', 'recordUpdateThread.js'),
    {user, surveyId},
    nodes => WebSocketManager.notifyUser(userId, WebSocketEvents.nodesUpdate, nodes),
    () => recordUpdateThreads.removeThread(userId)
  )

  recordUpdateThreads.putThread(userId, thread)

  return thread
}

/**
 * Start record update thread
 */
const checkIn = (user, surveyId, preview = false) => {
  cancelCheckOut(user.id)
  if (!recordUpdateThreads.getThread(user.id)) {
    createRecordUpdateThread(user, surveyId, preview)
  }
}

/**
 * Stop record update thread
 * @param userId
 */
const checkOut = userId => {
  if (!checkOutTimeoutsByUserId[userId]) {
    checkOutTimeoutsByUserId[userId] = setTimeout(() => {
      const updateWorker = recordUpdateThreads.getThread(userId)
      if (updateWorker) {
        updateWorker.terminate()
      }

      delete checkOutTimeoutsByUserId[userId]
    }, 1000)
  }
}

const cancelCheckOut = userId => {
  const timeout = checkOutTimeoutsByUserId[userId]
  if (timeout)
    clearTimeout(timeout)
}

/**
 * Create a new record and adds the root entity
 * It internally uses an instance of RecordUpdateThread to simulate the behaviour in the main event loop
 *
 * @param user
 * @param surveyId
 * @param record
 * @returns {Promise<void>}
 */
const createRecord = async (user, surveyId, record) => {
  const recordUpdateThread = RecordUpdateThread.newInstance()
  await recordUpdateThread.processMessage({type: recordThreadMessageTypes.createRecord, user, surveyId, record})
}

/**
 * Notify thread to create or update a node
 *
 * @param user
 * @param surveyId
 * @param node
 */
const persistNode = (user, surveyId, node) => {
  const updateWorker = recordUpdateThreads.getThread(user.id)
  updateWorker.postMessage({type: recordThreadMessageTypes.persistNode, user, surveyId, node})
}

/**
 * Notify thread to delete a node
 *
 * @param user
 * @param surveyId
 * @param nodeUuid
 */
const deleteNode = (user, surveyId, nodeUuid) => {
  const updateWorker = recordUpdateThreads.getThread(user.id)
  updateWorker.postMessage({type: recordThreadMessageTypes.deleteNode, user, surveyId, nodeUuid})
}

module.exports = {
  checkIn,
  checkOut,

  createRecord,
  persistNode,
  deleteNode,
}