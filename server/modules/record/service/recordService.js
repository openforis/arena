const R = require('ramda')
const path = require('path')
const fs = require('fs')

const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')
const RecordFile = require('../../../../common/record/recordFile')
const { canEditRecord } = require('../../../../common/auth/authManager')
const User = require('../../../../common/user/user')

const WebSocket = require('../../../utils/webSocket')
const WebSocketEvents = require('../../../../common/webSocket/webSocketEvents')
const ThreadManager = require('../../../threads/threadManager')

const RecordUpdateManager = require('../persistence/recordUpdateManager')
const RecordManager = require('../persistence/recordManager')
const FileManager = require('../persistence/fileManager')

const RecordUsersMap = require('./update/recordUsersMap')
const RecordThreads = require('./update/thread/recordThreads')
const recordThreadMessageTypes = require('./update/thread/recordThreadMessageTypes')

const checkOutTimeoutsByUserId = {}

/**
 * ======
 * THREAD
 * ======
 */
const createUserThread = (user, surveyId, recordUuid, preview) => {
  const userId = user.id

  RecordUsersMap.assocUser(surveyId, recordUuid, user, preview)

  const filePath = path.resolve(__dirname, 'update', 'thread', 'recordUpdateThread.js')
  const data = { user, surveyId, recordUuid }

  const messageHandler = msg => {
    const userIds = RecordUsersMap.getUserIds(recordUuid)
    userIds.forEach(userId =>
      WebSocket.notifyUser(userId, msg.type, R.prop('content', msg))
    )
  }

  const exitHandler = () => {
    RecordUsersMap.dissocUserId(recordUuid, userId)
    RecordThreads.removeThreadByUserId(userId)
  }

  const thread = new ThreadManager(filePath, data, messageHandler, exitHandler)

  return RecordThreads.putThreadByUserId(userId, thread)
}

const terminateUserThread = userId => {
  if (!checkOutTimeoutsByUserId[userId])
    checkOutTimeoutsByUserId[userId] = setTimeout(
      () => {
        const updateWorker = RecordThreads.getThreadByUserId(userId)
        if (updateWorker)
          updateWorker.terminate()

        delete checkOutTimeoutsByUserId[userId]
      },
      1000
    )
}

/**
 * ======
 * RECORD
 * ======
 */
const deleteRecord = async (user, surveyId, recordUuid) => {
  await RecordUpdateManager.deleteRecord(user, surveyId, recordUuid)

  const recordUsersIds = RecordUsersMap.getUserIds(recordUuid)

  //notify users that record has been deleted
  recordUsersIds.forEach(userIdRecord => {
    if (userIdRecord !== user.id) {
      WebSocket.notifyUser(userIdRecord, WebSocketEvents.recordDelete, recordUuid)
      terminateUserThread(userIdRecord)
    }
  })
}

const checkIn = async (user, surveyId, recordUuid) => {
  const record = await RecordManager.fetchRecordAndNodesByUuid(surveyId, recordUuid)

  if (canEditRecord(user, record)) {
    cancelCheckOut(user.id)
    if (!RecordThreads.getThreadByUserId(user.id)) {
      //Start record update thread
      createUserThread(user, surveyId, recordUuid, Record.isPreview(record))
    }
  }

  return record
}

const checkOut = async (user, surveyId, recordUuid) => {
  const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)

  if (Record.isPreview(record)) {
    await RecordUpdateManager.deleteRecordPreview(surveyId, recordUuid)
  }

  terminateUserThread(User.getId(user))
}

const cancelCheckOut = userId => {
  const timeout = checkOutTimeoutsByUserId[userId]
  if (timeout) {
    clearTimeout(timeout)
    delete checkOutTimeoutsByUserId[userId]
  }
}

/**
 * ======
 * NODE
 * ======
 */
const persistNode = async (user, surveyId, node, fileReq) => {
  if (fileReq) {
    //save file to "file" table and set fileUuid and fileName into node value
    const file = RecordFile.createFile(Node.getFileUuid(node), fileReq.name, fileReq.size, fs.readFileSync(fileReq.tempFilePath),
      Node.getRecordUuid(node), Node.getUuid(node))

    await FileManager.insertFile(surveyId, file)
  }

  const updateWorker = RecordThreads.getThreadByUserId(user.id)
  updateWorker.postMessage({ type: recordThreadMessageTypes.persistNode, node })
}

const deleteNode = (user, nodeUuid) => {
  const updateWorker = RecordThreads.getThreadByUserId(user.id)
  updateWorker.postMessage({ type: recordThreadMessageTypes.deleteNode, nodeUuid })
}

module.exports = {
  //====== RECORD

  //create
  createRecord: RecordUpdateManager.createRecord,

  //read
  fetchRecordByUuid: RecordManager.fetchRecordByUuid,
  countRecordsBySurveyId: RecordManager.countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId: RecordManager.fetchRecordsSummaryBySurveyId,

  //update
  updateRecordStep: RecordUpdateManager.updateRecordStep,

  // delete
  deleteRecord,
  deleteRecordsPreview: RecordUpdateManager.deleteRecordsPreview,

  checkIn,
  checkOut,
  terminateUserThread,

  //======  NODE
  fetchNodeByUuid: RecordManager.fetchNodeByUuid,
  persistNode,
  deleteNode,

  //==== UTILS
  getStalePreviewRecordUuids: RecordUsersMap.getStalePreviewRecordUuids,
}