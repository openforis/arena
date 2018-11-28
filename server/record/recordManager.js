const R = require('ramda')
const db = require('../db/db')

const NodeDefRepository = require('../nodeDef/nodeDefRepository')
const RecordRepository = require('../record/recordRepository')
const NodeRepository = require('../record/nodeRepository')
const Node = require('../../common/record/node')

const {toUUIDIndexedObj} = require('../../common/survey/surveyUtils')

const RecordUpdateManager = require('./update/recordUpdateManager')
const RecordProcessor = require('./update/thread/recordProcessor')

/**
 * ===================
 * CREATE
 * ===================
 */
const createRecord = async (userId, recordToCreate) =>
  await db.tx(
    async t => {
      const record = await RecordRepository.insertRecord(recordToCreate, t)
      const {surveyId, id: recordId} = record

      const rootNodeDef = await NodeDefRepository.fetchRootNodeDef(surveyId, false, t)

      const nodes = await RecordProcessor.createNode(rootNodeDef, Node.newNode(rootNodeDef.id, recordId), null, t)

      RecordUpdateManager.checkIn(userId)

      return R.assoc('nodes', nodes, record)
    }
  )

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

const fetchRecordById = async (surveyId, recordId) => {
  const record = await RecordRepository.fetchRecordById(surveyId, recordId)
  const nodes = await NodeRepository.fetchNodesByRecordId(surveyId, recordId)

  return {...record, nodes: toUUIDIndexedObj(nodes)}
}

/**
 * ===================
 * UPDATE
 * ===================
 */

const persistNode = (userId, surveyId, node, file) => {
  RecordUpdateManager.persistNode(userId, surveyId, node, file)
}

/**
 * ===================
 * DELETE
 * ===================
 */
const deleteRecord = async (surveyId, recordId) =>
  await RecordRepository.deleteRecord(surveyId, recordId)

const deleteNode = async (userId, surveyId, nodeUUID) =>
  await RecordUpdateManager.deleteNode(userId, surveyId, nodeUUID)

/**
 * ==================
 * CHECK IN / OUT RECORD
 * ==================
 */
const checkInRecord = async (userId, surveyId, recordId) => {
  const record = await fetchRecordById(surveyId, recordId)

  RecordUpdateManager.checkIn(userId)

  return record
}

const checkOutRecord = RecordUpdateManager.checkOut

module.exports = {
  //==== CREATE
  createRecord,
  persistNode,
  // createNode,

  //==== READ
  countRecordsBySurveyId: RecordRepository.countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId,
  fetchNodeFileByUUID: NodeRepository.fetchNodeFileByUUID,

  //==== UPDATE
  // NodeRepository.updateNodeValue,

  //==== DELETE
  deleteRecord,
  deleteNode,

  //==== UTILS
  checkInRecord,
  checkOutRecord,
}
