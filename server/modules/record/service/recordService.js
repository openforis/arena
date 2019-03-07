const R = require('ramda')

const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')
const RecordFile = require('../../../../common/record/recordFile')
const { canEditRecord } = require('../../../../common/auth/authManager')

const WebSocketManager = require('../../../webSocket/webSocketManager')
const WebSocketEvents = require('../../../../common/webSocket/webSocketEvents')
const ThreadManager = require('../../../threads/threadManager')

const RecordUpdateManager = require('../persistence/recordUpdateManager')
const RecordManager = require('../persistence/recordManager')
const FileManager = require('../../../file/fileManager')

const RecordUsersMap = require('./update/recordUsersMap')
const RecordThreads = require('./update/thread/recordThreads')
const recordThreadMessageTypes = require('./update/thread/recordThreadMessageTypes')

const checkOutTimeoutsByUserId = {}

/**
 * ====== THREAD
 */

const createThread = (user, surveyId, recordUuid, preview) => {
  const userId = user.id

  RecordUsersMap.assocUser(surveyId, recordUuid, user, preview)

  const filePath = path.resolve(__dirname, 'thread', 'recordUpdateThread.js')
  const data = { user, surveyId, recordUuid }

  const messageHandler = msg => {
    const userIds = RecordUsersMap.getUserIds(recordUuid)
    userIds.forEach(userId =>
      WebSocketManager.notifyUser(userId, msg.type, R.prop('content', msg))
    )
  }

  const exitHandler = () => {
    RecordUsersMap.dissocUserId(recordUuid, userId)
    RecordThreads.removeThreadByUserId(userId)
  }

  const thread = new ThreadManager(filePath, data, messageHandler, exitHandler)

  return RecordThreads.putThreadByUserId(userId, thread)
}

const terminateThread = userId => {
  if (!checkOutTimeoutsByUserId[userId])
    checkOutTimeoutsByUserId[userId] = setTimeout(
      () => {
        const updateWorker = RecordThreads.getThreadByUserId(userId)
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
      WebSocketManager.notifyUser(userIdRecord, WebSocketEvents.recordDelete, recordUuid)
      terminateThread(userIdRecord)
    }
  })
}

const checkIn = async (user, surveyId, recordUuid) => {
  const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)

  if (canEditRecord(user, record)) {
    cancelCheckOut(user.id)
    if (!RecordThreads.getThreadByUserId(user.id)) {
      //Start record update thread
      createThread(user, surveyId, recordUuid, Record.isPreview(record))
    }
  }

  return record
}

const checkOut = async (user, surveyId, recordUuid) => {
  const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)

  if (Record.isPreview(record)) {
    await RecordUpdateManager.deleteRecordPreview(user, surveyId, recordUuid)
  }

  terminateThread(user.id)
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
  let nodeToPersist
  if (fileReq) {
    //save file to "file" table and set fileUuid and fileName into node value
    const file = RecordFile.createFile(fileReq)

    await FileManager.insertFile(surveyId, file)

    const nodeValue = {
      fileUuid: file.uuid,
      fileName: RecordFile.getName(file),
      fileSize: RecordFile.getSize(file)
    }

    nodeToPersist = Node.assocValue(nodeValue, node)
  } else {
    nodeToPersist = node
  }

  const updateWorker = RecordThreads.getThreadByUserId(user.id)
  updateWorker.postMessage({ type: recordThreadMessageTypes.persistNode, node: nodeToPersist })
}

const deleteNode = (user, nodeUuid) => {
  const updateWorker = RecordThreads.getThreadByUserId(user.id)
  updateWorker.postMessage({ type: recordThreadMessageTypes.deleteNode, nodeUuid })
}

module.exports = {
  //RECORD

  //create
  createRecord: RecordUpdateManager.createRecord,
  //read
  countRecordsBySurveyId: RecordManager.countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId: RecordManager.fetchRecordsSummaryBySurveyId,
  //update
  updateRecordStep: RecordUpdateManager.updateRecordStep,
  // delete
  deleteRecord,

  checkIn,
  checkOut,

  // NODE
  fetchNodeByUuid: RecordManager.fetchNodeByUuid,
  persistNode,
  deleteNode,

  //==== UTILS
  getStalePreviewRecordUuids: RecordUsersMap.getStalePreviewRecordUuids,
}