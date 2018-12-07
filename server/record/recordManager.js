const db = require('../db/db')

const NodeDefRepository = require('../nodeDef/nodeDefRepository')
const RecordRepository = require('../record/recordRepository')
const NodeRepository = require('../record/nodeRepository')
const FileManager = require('../file/fileManager')
const Node = require('../../common/record/node')
const File = require('../../common/file/file')

const {toUuidIndexedObj} = require('../../common/survey/surveyUtils')

const RecordUpdateManager = require('./update/recordUpdateManager')

/**
 * ===================
 * CREATE
 * ===================
 */
const createRecord = (user, surveyId, record) => {
  RecordUpdateManager.checkIn(user.id)

  RecordUpdateManager.createRecord(user, surveyId, record)
}

/**
 * ===================
 * READ
 * ===================
 */
const fetchRecordsSummaryBySurveyId = async (surveyId, offset, limit) => {
  const nodeDefKeys = await NodeDefRepository.fetchRootNodeDefKeysBySurveyId(surveyId)
  return {
    nodeDefKeys,
    records: await RecordRepository.fetchRecordsSummaryBySurveyId(surveyId, nodeDefKeys, offset, limit)
  }
}

const fetchRecordByUuid = async (surveyId, recordUuid) => {
  const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid)
  const nodes = await NodeRepository.fetchNodesByRecordUuid(surveyId, recordUuid)

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
const deleteRecord = async (user, surveyId, recordUuid) => await RecordRepository.deleteRecord(user, surveyId, recordUuid)

const deleteNode = (user, surveyId, nodeUuid) => RecordUpdateManager.deleteNode(user, surveyId, nodeUuid)

/**
 * ==================
 * CHECK IN / OUT RECORD
 * ==================
 */
const checkInRecord = async (userId, surveyId, recordUuid) => {
  RecordUpdateManager.checkIn(userId)
  return await fetchRecordByUuid(surveyId, recordUuid)
}

const checkOutRecord = RecordUpdateManager.checkOut

module.exports = {
  //==== CREATE
  createRecord,

  //==== READ
  fetchRecordById,
  countRecordsBySurveyId: RecordRepository.countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId,
  fetchNodeByUuid: NodeRepository.fetchNodeByUuid,

  //==== UPDATE
  persistNode,

  //==== DELETE
  deleteRecord,
  deleteNode,

  //==== UTILS
  checkInRecord,
  checkOutRecord,
}
