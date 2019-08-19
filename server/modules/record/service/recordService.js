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

const checkOutTimeoutsByRecordUuid = {}

/**
 * ======
 * THREAD
 * ======
 */
const createRecordThread = (user, surveyId, recordUuid, preview, singleMessageHandling) => {
  cancelCheckOut(recordUuid)

  // terminate old thread, if any
  _terminateRecordThreadInstantly(recordUuid)

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
    RecordUsersMap.dissocUser(recordUuid, User.getUuid(user))
    RecordThreads.removeThreadByRecordUuid(recordUuid)
  }

  const thread = new ThreadManager(filePath, data, messageHandler, exitHandler, singleMessageHandling)

  return RecordThreads.putThreadByRecordUuid(recordUuid, thread)
}

const getOrCreatedRecordThread = (user, surveyId, recordUuid, preview = false, singleMessageHandling = false) => {
  const thread = RecordThreads.getThreadByRecordUuid(recordUuid)
  return thread || createRecordThread(user, surveyId, recordUuid, preview, singleMessageHandling)
}

const terminateRecordThread = recordUuid => {
  if (!checkOutTimeoutsByRecordUuid[recordUuid])
    checkOutTimeoutsByRecordUuid[recordUuid] = setTimeout(
      () => {
        _terminateRecordThreadInstantly(recordUuid)
        delete checkOutTimeoutsByRecordUuid[recordUuid]
      },
      1000
    )
}

const _terminateRecordThreadInstantly = recordUuid => {
  const updateWorker = RecordThreads.getThreadByRecordUuid(recordUuid)
  if (updateWorker)
    updateWorker.terminate()
}

const dissocUserFromRecordThread = userUuid => {
  const recordUuid = RecordUsersMap.getRecordUuid(userUuid)
  if (recordUuid) {
    RecordUsersMap.dissocUser(recordUuid, userUuid)

    // terminate thread if there are no more users editing that record
    const userUuids = RecordUsersMap.getUserUuids(recordUuid)
    if (R.isEmpty(userUuids)) {
      terminateRecordThread(recordUuid)
    }
  }
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
      terminateRecordThread(recordUuid)
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
    getOrCreatedRecordThread(user, surveyId, recordUuid, Record.isPreview(record), false)
  }

  return record
}

const checkOut = async (user, surveyId, recordUuid) => {
  const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)

  if (Record.isPreview(record)) {
    await RecordManager.deleteRecordPreview(surveyId, recordUuid)
  }

  dissocUserFromRecordThread(User.getUuid(user))
}

const cancelCheckOut = recordUuid => {
  const timeout = checkOutTimeoutsByRecordUuid[recordUuid]
  if (timeout) {
    clearTimeout(timeout)
    delete checkOutTimeoutsByRecordUuid[recordUuid]
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
  const thread = getOrCreatedRecordThread(user, surveyId, Node.getRecordUuid(node), false, true)
  thread.postMessage({ type: recordThreadMessageTypes.persistNode, node })
}

const deleteNode = (user, surveyId, recordUuid, nodeUuid) => {
  const thread = getOrCreatedRecordThread(user, surveyId, recordUuid, false, true)
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

  //update
  updateRecordStep: RecordManager.updateRecordStep,

  // delete
  deleteRecord,
  deleteRecordsPreview: RecordManager.deleteRecordsPreview,

  checkIn,
  checkOut,
  dissocUserFromRecordThread,

  // ======  NODE
  fetchNodeByUuid: RecordManager.fetchNodeByUuid,
  persistNode,
  deleteNode,

  //==== UTILS
  getStalePreviewRecordUuids: RecordUsersMap.getStalePreviewRecordUuids,
}