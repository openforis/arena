const R = require('ramda')
const path = require('path')

const WebSocketManager = require('../../webSocket/webSocketManager')

const ThreadsCache = require('../../threads/threadsCache')
const ThreadManager = require('../../threads/threadManager')

const recordThreadMessageTypes = require('./thread/recordThreadMessageTypes')

const recordUpdateThreads = new ThreadsCache()
const checkOutTimeoutsByUserId = {}
const Record = require('../../../common/record/record')

const RecordUpdateThread = require('./thread/recordUpdateThread')

// Users edting the same record
let recordUsersMap = {}
const addRecordUser = (recordUuid, userId) => { recordUsersMap = R.assocPath([recordUuid, userId], null, recordUsersMap) }
const getRecordUsers = recordUuid => R.pipe(R.prop(recordUuid), R.keys)(recordUsersMap)
const removeRecordUser = (recordUuid, userId) => R.dissocPath([recordUuid, userId], recordUsersMap)

const createRecordUpdateThread = (user, surveyId, recordUuid, preview) => {
  const userId = user.id

  addRecordUser(recordUuid, userId)

  const thread = new ThreadManager(
    path.resolve(__dirname, 'thread', 'recordUpdateThread.js'),
    { user, surveyId, recordUuid, preview },
    msg => getRecordUsers(recordUuid).forEach(userId =>
      WebSocketManager.notifyUser(userId, msg.type, R.prop('content', msg))
    ),
    () => {
      recordUpdateThreads.removeThread(userId)
      removeRecordUser(recordUuid, userId)
    }
  )

  recordUpdateThreads.putThread(userId, thread)

  return thread
}

/**
 * Start record update thread
 */
const checkIn = (user, surveyId, recordUuid, preview) => {
  cancelCheckOut(user.id)
  if (!recordUpdateThreads.getThread(user.id)) {
    createRecordUpdateThread(user, surveyId, recordUuid, preview)
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
  const recordUpdateThread = RecordUpdateThread.newInstance({
    user,
    surveyId,
    recordUuid: Record.getUuid(record),
    preview: Record.isPreview(record)
  })
  await recordUpdateThread.processMessage({ type: recordThreadMessageTypes.createRecord, record })
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
  updateWorker.postMessage({ type: recordThreadMessageTypes.persistNode, node })
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
  updateWorker.postMessage({ type: recordThreadMessageTypes.deleteNode, nodeUuid })
}

module.exports = {
  checkIn,
  checkOut,

  createRecord,
  persistNode,
  deleteNode,
}
