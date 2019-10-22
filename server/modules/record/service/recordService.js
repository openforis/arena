const R = require('ramda')
const fs = require('fs')

const Logger = require('@server/log/log').getLogger('RecordService')

const Survey = require('@core/survey/survey')
const Record = require('@core/record/record')
const Node = require('@core/record/node')
const RecordFile = require('@core/record/recordFile')
const Authorizer = require('@core/auth/authorizer')

const WebSocketEvents = require('@common/webSocket/webSocketEvents')
const WebSocket = require('@server/utils/webSocket')

const SurveyManager = require('../../survey/manager/surveyManager')
const RecordManager = require('../manager/recordManager')
const FileManager = require('../manager/fileManager')

const RecordServiceThreads = require('./update/recordServiceThreads')
const RecordThreadMessageTypes = require('./update/thread/recordThreadMessageTypes')

/**
 * ======
 * RECORD
 * ======
 */
const createRecord = async (socketId, user, surveyId, recordToCreate) => {
  Logger.debug('create record: ', recordToCreate)

  const record = await RecordManager.insertRecord(user, surveyId, recordToCreate)

  // create record thread and initialize record
  const thread = RecordServiceThreads.getOrCreatedRecordThread(socketId, user, surveyId, Record.getUuid(recordToCreate))
  thread.postMessage({ type: RecordThreadMessageTypes.recordInit })

  return record
}

const deleteRecord = async (socketId, user, surveyId, recordUuid) => {
  Logger.debug('delete record. surveyId:', surveyId, 'recordUuid:', recordUuid)

  await RecordManager.deleteRecord(user, surveyId, recordUuid)

  // notify other users viewing or editing the record it has been deleted
  const socketIds = RecordServiceThreads.getSocketIds(recordUuid)
  socketIds.forEach(socketIdCurrent => {
    if (socketIdCurrent !== socketId) {
      WebSocket.notifyUser(socketIdCurrent, WebSocketEvents.recordDelete, recordUuid)
    }
  })
  RecordServiceThreads.dissocSocketsByRecordUuid(recordUuid)
}

const checkIn = async (socketId, user, surveyId, recordUuid, draft) => {
  const survey = await SurveyManager.fetchSurveyById(surveyId, draft, false)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const record = await RecordManager.fetchRecordAndNodesByUuid(surveyId, recordUuid, draft)
  const preview = Record.isPreview(record)

  if (preview || (Survey.isPublished(surveyInfo) && Authorizer.canEditRecord(user, record))) {
    RecordServiceThreads.getOrCreatedRecordThread(socketId, user, surveyId, recordUuid)
  }
  RecordServiceThreads.assocSocket(recordUuid, socketId)

  return record
}

const checkOut = async (socketId, user, surveyId, recordUuid) => {
  const record = await RecordManager.fetchRecordByUuid(surveyId, recordUuid)

  if (Record.isPreview(record)) {
    await RecordManager.deleteRecordPreview(surveyId, recordUuid)
  }

  RecordServiceThreads.dissocSocket(socketId)
}

/**
 * ======
 * NODE
 * ======
 */
const _sendNodeUpdateMessage = (socketId, user, surveyId, recordUuid, msg) => {
  RecordServiceThreads.assocSocket(recordUuid, socketId)

  const singleMessage = !RecordServiceThreads.getRecordThread(recordUuid)

  const thread = RecordServiceThreads.getOrCreatedRecordThread(socketId, user, surveyId, recordUuid)
  thread.postMessage(msg, user)

  if (singleMessage) {
    RecordServiceThreads.killRecordThread(recordUuid)
  }
}

const persistNode = async (socketId, user, surveyId, node, file) => {
  const recordUuid = Node.getRecordUuid(node)

  if (file) {
    //save file to "file" table and set fileUuid and fileName into node value
    const fileObj = RecordFile.createFile(Node.getFileUuid(node), file.name, file.size, fs.readFileSync(file.tempFilePath), recordUuid, Node.getUuid(node))
    await FileManager.insertFile(surveyId, fileObj)
  }

  _sendNodeUpdateMessage(
    socketId, user, surveyId, recordUuid, { type: RecordThreadMessageTypes.nodePersist, node, user }
  )
}

const deleteNode = (socketId, user, surveyId, recordUuid, nodeUuid) => _sendNodeUpdateMessage(
  socketId, user, surveyId, recordUuid, { type: RecordThreadMessageTypes.nodeDelete, nodeUuid, user }
)

const deleteRecordsPreview = async (olderThan24Hours = false) => {
  const surveyIds = await SurveyManager.fetchAllSurveyIds()
  const counts = await Promise.all(surveyIds.map(
    surveyId => RecordManager.deleteRecordsPreview(surveyId, olderThan24Hours)
  ))
  return R.sum(counts)
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
  dissocSocketFromRecordThread: RecordServiceThreads.dissocSocket,

  // ======  NODE
  fetchNodeByUuid: RecordManager.fetchNodeByUuid,
  persistNode,
  deleteNode,
}