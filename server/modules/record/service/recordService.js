const R = require('ramda')
const path = require('path')
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
const ThreadManager = require('../../../threads/threadManager')

const SurveyManager = require('../../survey/manager/surveyManager')
const RecordManager = require('../manager/recordManager')
const FileManager = require('../manager/fileManager')

const RecordUsersMap = require('./update/recordUsersMap')
const RecordThreads = require('./update/thread/recordThreads')
const recordThreadMessageTypes = require('./update/thread/recordThreadMessageTypes')
const RecordUpdateThreadParams = require('./update/thread/recordUpdateThreadParams')
const ThreadParams = require('../../../threads/threadParams')

/**
 * ======
 * THREAD
 * ======
 */
const _createRecordThread = (user, surveyId, recordUuid, preview, singleMessageHandling = false, initRecord = false) => {
  const filePath = path.resolve(__dirname, 'update', 'thread', 'recordUpdateThread.js')

  const data = {
    [ThreadParams.keys.user]: user,
    [ThreadParams.keys.surveyId]: surveyId,
    [RecordUpdateThreadParams.keys.recordUuid]: recordUuid,
    [RecordUpdateThreadParams.keys.initRecord]: initRecord
  }

  const messageHandler = msg => {

    if (msg.type === recordThreadMessageTypes.threadKill) {
      if (RecordThreads.isZombie(recordUuid)) {
        const thread = RecordThreads.get(recordUuid)
        thread.terminate()
      }
    } else {
      const userUuids = RecordUsersMap.getUserUuids(recordUuid)
      userUuids.forEach(userUuid =>
        WebSocket.notifyUser(userUuid, msg.type, R.prop('content', msg))
      )
    }
  }

  const exitHandler = () => {
    RecordUsersMap.dissocUsers(recordUuid)
    RecordThreads.remove(recordUuid)
  }

  const thread = new ThreadManager(filePath, data, messageHandler, exitHandler, singleMessageHandling)

  return RecordThreads.put(recordUuid, thread)
}

const _getOrCreatedRecordThread = (user, surveyId, recordUuid, preview = false, singleMessageHandling = false) => {
  const thread = RecordThreads.get(recordUuid)
  return thread || _createRecordThread(user, surveyId, recordUuid, preview, singleMessageHandling)
}

/**
 * ======
 * RECORD
 * ======
 */
const createRecord = async (user, surveyId, recordToCreate) => {
  Log.debug('create record: ', recordToCreate)

  const record = await RecordManager.insertRecord(surveyId, recordToCreate)

  // create record thread and initialize record
  _createRecordThread(user, surveyId, Record.getUuid(recordToCreate), Record.isPreview(recordToCreate), false, true)

  return record
}

const deleteRecord = async (user, surveyId, recordUuid) => {
  Log.debug('delete record. surveyId:', surveyId, 'recordUuid:', recordUuid)

  await RecordManager.deleteRecord(user, surveyId, recordUuid)

  //notify users that record has been deleted
  const recordUsersIds = RecordUsersMap.getUserUuids(recordUuid)
  recordUsersIds.forEach(userUuidRecord => {
    if (userUuidRecord !== User.getUuid(user)) {
      WebSocket.notifyUser(userUuidRecord, WebSocketEvents.recordDelete, recordUuid)
      RecordUsersMap.dissocUsers(recordUuid)
    }
  })

}

const checkIn = async (user, surveyId, recordUuid, draft) => {
  const survey = await SurveyManager.fetchSurveyById(surveyId, draft, false)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const record = await RecordManager.fetchRecordAndNodesByUuid(surveyId, recordUuid, draft)
  const preview = Record.isPreview(record)

  if (preview || (Survey.isPublished(surveyInfo) && Authorizer.canEditRecord(user, record))) {
    if (RecordThreads.isZombie(recordUuid)) {
      RecordThreads.reviveZombie(recordUuid)
    }
    _getOrCreatedRecordThread(user, surveyId, recordUuid, preview, false)
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
    const thread = RecordThreads.get(recordUuid)
    if (thread) {
      const userUuids = RecordUsersMap.getUserUuids(recordUuid)
      if (R.isEmpty(userUuids)) {
        RecordThreads.markZombie(recordUuid)
        thread.postMessage({ type: recordThreadMessageTypes.threadKill })
      }
    }
  }
}

/**
 * ======
 * NODE
 * ======
 */
const persistNode = async (user, surveyId, node, file) => {
  if (file) {
    //save file to "file" table and set fileUuid and fileName into node value
    const fileObj = RecordFile.createFile(Node.getFileUuid(node), file.name, file.size, fs.readFileSync(file.tempFilePath),
      Node.getRecordUuid(node), Node.getUuid(node))

    await FileManager.insertFile(surveyId, fileObj)
  }
  const thread = _getOrCreatedRecordThread(user, surveyId, Node.getRecordUuid(node), false, true)
  thread.postMessage({ type: recordThreadMessageTypes.nodePersist, node, user })
}

const deleteNode = (user, surveyId, recordUuid, nodeUuid) => {
  const thread = _getOrCreatedRecordThread(user, surveyId, recordUuid, false, true)
  thread.postMessage({ type: recordThreadMessageTypes.nodeDelete, nodeUuid, user })
}

const deleteRecordsPreview = async () => {
  const surveyIds = await SurveyManager.fetchAllSurveyIds()
  await Promise.all(
    surveyIds.map(surveyId =>
      RecordManager.deleteRecordsPreview(surveyId)
    )
  )
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