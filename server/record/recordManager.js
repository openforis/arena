const db = require('../db/db')

const NodeDefRepository = require('../nodeDef/nodeDefRepository')
const RecordRepository = require('../record/recordRepository')
const NodeRepository = require('../record/nodeRepository')
const FileManager = require('../file/fileManager')

const Node = require('../../common/record/node')
const File = require('../../common/file/file')
const {preview} = require('../../common/record/record')

const {toUuidIndexedObj} = require('../../common/survey/surveyUtils')

const RecordUpdateManager = require('./update/recordUpdateManager')
const ActivityLog = require('../activityLog/activityLogger')

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
  if (recordUuid === preview) {
    return {
      uuid: preview,
      nodes: {
        'root': {
          parentUuid: null,
          recordUuid: 'preview',
          uuid: 'root',
          value: null,
        }
      }
    }
  } else {
    const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, client)

    const nodes = await NodeRepository.fetchNodesByRecordUuid(surveyId, recordUuid, client)

    return {...record, nodes: toUuidIndexedObj(nodes)}
  }
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
  RecordUpdateManager.checkIn(user, surveyId, recordUuid === preview)

  return await fetchRecordByUuid(surveyId, recordUuid)

  // return !preview ?
  //   return await fetchRecordByUuid(surveyId, recordUuid, preview)
  //   :
  //   {uuid: preview}
}

const checkOutRecord = RecordUpdateManager.checkOut

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
