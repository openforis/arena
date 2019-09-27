const R = require('ramda')
const fs = require('fs')

const Log = require('../../../log/log').getLogger('RecordService')

const Survey = require('../../../../common/survey/survey')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')
const RecordFile = require('../../../../common/record/recordFile')
const Authorizer = require('../../../../common/auth/authorizer')
const User = require('../../../../common/user/user')

const WebSocket = require('../../../utils/webSocket')
const WebSocketEvents = require('../../../../common/webSocket/webSocketEvents')

const SurveyManager = require('../../survey/manager/surveyManager')
const RecordManager = require('../manager/recordManager')
const FileManager = require('../manager/fileManager')

const RecordUsersMap = require('./update/recordUsersMap')
const RecordServiceThreads = require('./update/recordServiceThreads')
const recordThreadMessageTypes = require('./update/thread/recordThreadMessageTypes')

/**
 * ======
 * RECORD
 * ======
 */
const createRecord = async (user, surveyId, recordToCreate) => {
  Log.debug('create record: ', recordToCreate)

  const record = await RecordManager.insertRecord(user, surveyId, recordToCreate)

  // create record thread and initialize record
  const thread = RecordServiceThreads.getOrCreatedRecordThread(user, surveyId, Record.getUuid(recordToCreate))
  thread.postMessage({ type: recordThreadMessageTypes.recordInit })

  return record
}

const deleteRecord = async (user, surveyId, recordUuid) => {
  Log.debug('delete record. surveyId:', surveyId, 'recordUuid:', recordUuid)

  await RecordManager.deleteRecord(user, surveyId, recordUuid)
  const userUuid = User.getUuid(user)

  // notify other users viewing or editing the record that it has been deleted
  const recordUsersIds = RecordUsersMap.getUserUuids(recordUuid)
  recordUsersIds.forEach(userUuidRecord => {
    if (userUuidRecord !== userUuid) {
      WebSocket.notifyUser(userUuidRecord, WebSocketEvents.recordDelete, recordUuid)
      RecordUsersMap.dissocUsers(recordUuid)
    }
  })

  dissocUserFromRecordThread(userUuid)
}

const checkIn = async (user, surveyId, recordUuid, draft) => {
  const survey = await SurveyManager.fetchSurveyById(surveyId, draft, false)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const record = await RecordManager.fetchRecordAndNodesByUuid(surveyId, recordUuid, draft)
  const preview = Record.isPreview(record)

  if (preview || (Survey.isPublished(surveyInfo) && Authorizer.canEditRecord(user, record))) {
    RecordServiceThreads.getOrCreatedRecordThread(user, surveyId, recordUuid)
  }
  RecordUsersMap.assocUser(surveyId, recordUuid, user, preview)

  return record
}

const checkOut = async (user, surveyId, recordUuid) => {
  const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)

  if (Record.isPreview(record)) {
    await RecordManager.deleteRecordPreview(surveyId, recordUuid)
  }

  dissocUserFromRecordThread(User.getUuid(user))
}

const dissocUserFromRecordThread = userUuid => {
  const recordUuid = RecordUsersMap.getRecordUuid(userUuid)
  if (recordUuid) {
    RecordUsersMap.dissocUser(recordUuid, userUuid)

    // terminate thread if there are no more users editing the record
    const thread = RecordServiceThreads.getRecordThread(recordUuid)
    if (thread) {
      const userUuids = RecordUsersMap.getUserUuids(recordUuid)
      if (R.isEmpty(userUuids)) {
        RecordServiceThreads.killRecordThread(recordUuid)
      }
    }
  }
}

/**
 * ======
 * NODE
 * ======
 */
const _sendNodeUpdateMessage = (user, surveyId, recordUuid, msg) => {
  const singleMessage = !RecordServiceThreads.getRecordThread(recordUuid)

  const thread = RecordServiceThreads.getOrCreatedRecordThread(user, surveyId, recordUuid)
  thread.postMessage(msg, user)

  if (singleMessage) {
    RecordServiceThreads.killRecordThread(recordUuid)
  }
}

const persistNode = async (user, surveyId, node, file) => {
  if (file) {
    //save file to "file" table and set fileUuid and fileName into node value
    const fileObj = RecordFile.createFile(Node.getFileUuid(node), file.name, file.size, fs.readFileSync(file.tempFilePath),
      Node.getRecordUuid(node), Node.getUuid(node))

    await FileManager.insertFile(surveyId, fileObj)
  }

  _sendNodeUpdateMessage(
    user,
    surveyId,
    Node.getRecordUuid(node),
    { type: recordThreadMessageTypes.nodePersist, node, user }
  )
}

const deleteNode = (user, surveyId, recordUuid, nodeUuid) =>
  _sendNodeUpdateMessage(
    user,
    surveyId,
    recordUuid,
    { type: recordThreadMessageTypes.nodeDelete, nodeUuid, user }
  )

const deleteRecordsPreview = async () => {
  const surveyIds = await SurveyManager.fetchAllSurveyIds()
  const countDeletedRecordsBySurvey = await Promise.all(
    surveyIds.map(surveyId =>
      RecordManager.deleteRecordsPreview(surveyId)
    )
  )

  return countDeletedRecordsBySurvey.reduce((sum, n) => sum + n, 0)
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
  deleteRecordsPreview,

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