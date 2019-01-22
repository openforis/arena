const R = require('ramda')

const db = require('../db/db')

const NodeDefRepository = require('../nodeDef/nodeDefRepository')
const RecordRepository = require('../record/recordRepository')
const NodeRepository = require('../record/nodeRepository')
const FileManager = require('../file/fileManager')

const Record = require('../../common/record/record')
const Node = require('../../common/record/node')
const File = require('../../common/file/file')

const {toUuidIndexedObj} = require('../../common/survey/surveyUtils')
const {isBlank} = require('../../common/stringUtils')

const RecordUpdateManager = require('./update/recordUpdateManager')
const ActivityLog = require('../activityLog/activityLogger')

const {canEditRecord} = require('../../common/auth/authManager')

/**
 * ===================
 * CREATE
 * ===================
 */
const createRecord = async (user, surveyId, record) =>
  await RecordUpdateManager.createRecord(user, surveyId, record)

/**
 * ===================
 * READ
 * ===================
 */
const fetchRecordsSummaryBySurveyId = async (surveyId, offset, limit, client = db) => {
  const nodeDefKeys = await NodeDefRepository.fetchRootNodeDefKeysBySurveyId(surveyId, false, client)
  return {
    nodeDefKeys,
    records: await RecordRepository.fetchRecordsSummaryBySurveyId(surveyId, nodeDefKeys, offset, limit, client)
  }
}

const fetchRecordByUuid = async (surveyId, recordUuid, client = db) => {
  const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, client)
  const nodes = await NodeRepository.fetchNodesByRecordUuid(surveyId, recordUuid, client)

  return {...record, nodes: toUuidIndexedObj(nodes)}
}

/**
 * ===================
 * UPDATE
 * ===================
 */

const persistNode = (user, surveyId, node, fileReq) => {
  let nodeToPersist
  if (fileReq) {
    //save file to "file" table and set fileUuid and fileName into node value
    const file = File.createFile(fileReq)

    FileManager.insertFile(surveyId, file)

    const nodeValue = {
      fileUuid: file.uuid,
      fileName: File.getName(file),
      fileSize: File.getSize(file)
    }

    nodeToPersist = Node.assocValue(nodeValue, node)
  } else {
    nodeToPersist = node
  }
  RecordUpdateManager.persistNode(user, surveyId, nodeToPersist)
}

/**
 * ===================
 * DELETE
 * ===================
 */
const deleteRecord = async (user, surveyId, recordUuid) =>
  await db.tx(async t => {
    await ActivityLog.log(user, surveyId, ActivityLog.type.recordDelete, {recordUuid}, t)
    await RecordRepository.deleteRecord(user, surveyId, recordUuid, t)
  })

const deleteNode = (user, surveyId, nodeUuid) => RecordUpdateManager.deleteNode(user, surveyId, nodeUuid)

/**
 * ==================
 * CHECK IN / OUT RECORD
 * ==================
 */
const checkInRecord = async (user, surveyId, recordUuid) => {
  const record = await fetchRecordByUuid(surveyId, recordUuid)

  if (canEditRecord(user, record)) {
    RecordUpdateManager.checkIn(user, surveyId, Record.isPreview(record))
  }

  return record
}

const checkOutRecord = async (user, surveyId, recordUuid) => {
  const record = await fetchRecordByUuid(surveyId, recordUuid)

  if (Record.isPreview(record)) {
    await deleteRecordPreview(user, surveyId, record)
  }

  RecordUpdateManager.checkOut(user.id)
}

const deleteRecordPreview = async (user, surveyId, record) =>
  await db.tx(async t => {
    const fileUuids = R.pipe(
      Record.getNodesArray,
      R.map(Node.getNodeFileUuid),
      R.reject(isBlank),
    )(record)
    // delete record and files
    await Promise.all([
        RecordRepository.deleteRecord(user, surveyId, Record.getUuid(record), t),
        ...fileUuids.map(fileUuid => FileManager.deleteFileByUuid(surveyId, fileUuid, t)),
      ]
    )

  })

module.exports = {
  //==== CREATE
  createRecord,

  //==== READ
  fetchRecordByUuid,
  countRecordsBySurveyId: RecordRepository.countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId,
  fetchNodeByUuid: NodeRepository.fetchNodeByUuid,
  fetchChildNodeByNodeDefUuid: NodeRepository.fetchChildNodeByNodeDefUuid,

  //==== UPDATE
  persistNode,

  //==== DELETE
  deleteRecord,
  deleteNode,

  //==== UTILS
  checkInRecord,
  checkOutRecord,
}
