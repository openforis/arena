const R = require('ramda')
const path = require('path')

const WebSocketManager = require('../../webSocket/webSocketManager')
const WebSocketEvents = require('../../../common/webSocket/webSocketEvents')

const ThreadsCache = require('../../threads/threadsCache')
const ThreadManager = require('../../threads/threadManager')

const recordThreadMessageTypes = require('./thread/recordThreadMessageTypes')

const recordUpdateThreads = new ThreadsCache()
const checkOutTimeoutsByUserId = {}
const Record = require('../../../common/record/record')

const RecordUsersMap = require('./recordUsersMap')
const RecordUpdateThread = require('./thread/recordUpdateThread')

const createRecordUpdateThread = (user, surveyId, recordUuid, preview) => {
  const userId = user.id

  RecordUsersMap.assocUser(surveyId, recordUuid, user, preview)

  const thread = new ThreadManager(
    path.resolve(__dirname, 'thread', 'recordUpdateThread.js'),
    { user, surveyId, recordUuid, preview },
    msg => {
      const userIds = RecordUsersMap.getUserIds(surveyId, recordUuid)
      userIds.forEach(userId =>
        WebSocketManager.notifyUser(userId, msg.type, R.prop('content', msg))
      )

      if (preview) RecordUsersMap.touchPreviewRecord(recordUuid)
    },
    () => {
      RecordUsersMap.dissocUserId(recordUuid, userId)
      recordUpdateThreads.removeThread(userId)
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
  if (timeout) {
    clearTimeout(timeout)
    delete checkOutTimeoutsByUserId[userId]
  }
}

/**
 * Create a new record and adds the root entity
 * It internally uses an instance of RecordUpdateThread to simulate the behaviour in the main event loop
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

const persistNode = (user, surveyId, node) => {
  const updateWorker = recordUpdateThreads.getThread(user.id)
  updateWorker.postMessage({ type: recordThreadMessageTypes.persistNode, node })
}

const deleteNode = (user, nodeUuid) => {
  const updateWorker = recordUpdateThreads.getThread(user.id)
  updateWorker.postMessage({ type: recordThreadMessageTypes.deleteNode, nodeUuid })
}

/**
 * Notify users editing a record that the record has been deleted
 * Also does the checkOuts
 *
 * @param recordUuid
 * @param userIdExclude Do not notify the user that has deleted the record
 */
const notifyUsersRecordDeleted = (surveyId, recordUuid, userIdExclude) => {
  const recordUsersIds = RecordUsersMap.getUserIds(recordUuid)

  recordUsersIds.forEach(id => {
    if (id !== userIdExclude) {
      WebSocketManager.notifyUser(id, WebSocketEvents.recordDelete, recordUuid)
      checkOut(id)
    }
  })
}

// ==== UTILS

const getEditingRecordUuids = RecordUsersMap.getRecordUuids

module.exports = {
  checkIn,
  checkOut,

  createRecord,
  persistNode,
  deleteNode,

  notifyUsersRecordDeleted,

  getEditingRecordUuids,
}
