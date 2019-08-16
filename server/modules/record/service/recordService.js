const R = require('ramda')
const path = require('path')
const fs = require('fs')

const Survey = require('../../../../common/survey/survey')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')
const RecordFile = require('../../../../common/record/recordFile')
const Authorizer = require('../../../../common/auth/authorizer')
const User = require('../../../../common/user/user')

const WebSocket = require('../../../utils/webSocket')
const WebSocketEvents = require('../../../../common/webSocket/webSocketEvents')
const ThreadManager = require('../../../threads/threadManager')

const SurveyManager = require('../../survey/manager/surveyManager')
const RecordManager = require('../manager/recordManager')
const FileManager = require('../manager/fileManager')

const RecordUsersMap = require('./update/recordUsersMap')
const RecordThreads = require('./update/thread/recordThreads')
const recordThreadMessageTypes = require('./update/thread/recordThreadMessageTypes')

const checkOutTimeoutsByUserUuid = {}

/**
 * ======
 * THREAD
 * ======
 */
const createUserThread = (user, surveyId, recordUuid, preview, singleMessageHandling) => {
  const userUuid = User.getUuid(user)

  cancelCheckOut(userUuid)

  // terminate old thread, if any
  const oldThread = RecordThreads.getThreadByUserUuid(userUuid)
  if (oldThread) {
    oldThread.terminate()
  }

  RecordUsersMap.assocUser(surveyId, recordUuid, user, preview)

  const filePath = path.resolve(__dirname, 'update', 'thread', 'recordUpdateThread.js')
  const data = { user, surveyId, recordUuid }

  const messageHandler = msg => {
    const userUuids = RecordUsersMap.getUserUuids(recordUuid)
    userUuids.forEach(userUuid =>
      WebSocket.notifyUser(userUuid, msg.type, R.prop('content', msg))
    )
  }

  const exitHandler = () => {
    RecordUsersMap.dissocUserUuid(recordUuid, userUuid)
    RecordThreads.removeThreadByUserUuid(userUuid)
  }

  const thread = new ThreadManager(filePath, data, messageHandler, exitHandler, singleMessageHandling)

  return RecordThreads.putThreadByUserUuid(userUuid, thread)
}

const getOrCreatedUserThread = (user, surveyId, recordUuid, preview = false, singleMessageHandling = false) => {
  const thread = RecordThreads.getThreadByUserUuid(User.getUuid(user))
  return thread || createUserThread(user, surveyId, recordUuid, preview, singleMessageHandling)
}

const terminateUserThread = userUuid => {
  if (!checkOutTimeoutsByUserUuid[userUuid])
    checkOutTimeoutsByUserUuid[userUuid] = setTimeout(
      () => {
        const updateWorker = RecordThreads.getThreadByUserUuid(userUuid)
        if (updateWorker)
          updateWorker.terminate()

        delete checkOutTimeoutsByUserUuid[userUuid]
      },
      1000
    )
}

/**
 * ======
 * RECORD
 * ======
 */
const createRecord = async (user, surveyId, recordToCreate) => {
  const preview = Record.isPreview(recordToCreate)
  const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(surveyId, preview, true, false)
  return await RecordManager.createRecord(user, survey, recordToCreate)
}

const deleteRecord = async (user, surveyId, recordUuid) => {
  await RecordManager.deleteRecord(user, surveyId, recordUuid)

  const recordUsersIds = RecordUsersMap.getUserUuids(recordUuid)

  //notify users that record has been deleted
  recordUsersIds.forEach(userUuidRecord => {
    if (userUuidRecord !== User.getUuid(user)) {
      WebSocket.notifyUser(userUuidRecord, WebSocketEvents.recordDelete, recordUuid)
      terminateUserThread(userUuidRecord)
    }
  })
}

const checkIn = async (user, surveyId, recordUuid, draft) => {
  const survey = await SurveyManager.fetchSurveyById(surveyId, draft, false)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const record = await RecordManager.fetchRecordAndNodesByUuid(surveyId, recordUuid, draft)

  if (
    (Survey.isPublished(surveyInfo) || Record.isPreview(record)) &&
    Authorizer.canEditRecord(user, record)
  ) {
    createUserThread(user, surveyId, recordUuid, Record.isPreview(record), false)
  }

  return record
}

const checkOut = async (user, surveyId, recordUuid) => {
  const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)

  if (Record.isPreview(record)) {
    await RecordManager.deleteRecordPreview(surveyId, recordUuid)
  }

  terminateUserThread(User.getUuid(user))
}

const cancelCheckOut = userUuid => {
  const timeout = checkOutTimeoutsByUserUuid[userUuid]
  if (timeout) {
    clearTimeout(timeout)
    delete checkOutTimeoutsByUserUuid[userUuid]
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
  const thread = getOrCreatedUserThread(user, surveyId, Node.getRecordUuid(node), false, true)
  thread.postMessage({ type: recordThreadMessageTypes.persistNode, node })
}

const deleteNode = (user, surveyId, recordUuid, nodeUuid) => {
  const thread = getOrCreatedUserThread(user, surveyId, recordUuid, false, true)
  thread.postMessage({ type: recordThreadMessageTypes.deleteNode, nodeUuid })
}

module.exports = {
  // ====== RECORD

  //create
  createRecord,

  //read
  fetchRecordByUuid: RecordManager.fetchRecordByUuid,
  countRecordsBySurveyId: RecordManager.countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId: RecordManager.fetchRecordsSummaryBySurveyId,
  fetchRecordCreatedCountsByDates: RecordManager.fetchRecordCreatedCountsByDates,

  //update
  updateRecordStep: RecordManager.updateRecordStep,

  // delete
  deleteRecord,
  deleteRecordsPreview: RecordManager.deleteRecordsPreview,

  checkIn,
  checkOut,
  terminateUserThread,

  // ======  NODE
  fetchNodeByUuid: RecordManager.fetchNodeByUuid,
  persistNode,
  deleteNode,

  //==== UTILS
  getStalePreviewRecordUuids: RecordUsersMap.getStalePreviewRecordUuids,
}