const db = require('../db/db')

const NodeDefRepository = require('../nodeDef/nodeDefRepository')
const RecordRepository = require('../record/recordRepository')
const NodeRepository = require('../record/nodeRepository')
const Node = require('../../common/record/node')

const {toUuidIndexedObj} = require('../../common/survey/surveyUtils')

const RecordUpdateManager = require('./update/recordUpdateManager')

/**
 * ===================
 * CREATE
 * ===================
 */
const createRecord = async (user, recordToCreate) => await db.tx(
  async t => {

    RecordUpdateManager.checkIn(user.id)

    const record = await RecordRepository.insertRecord(recordToCreate, t)
    const {surveyId, id: recordId} = record

    const rootNodeDef = await NodeDefRepository.fetchRootNodeDef(surveyId, false, t)
    const rootNode = Node.newNode(rootNodeDef.uuid, recordId)

    persistNode(user, surveyId, rootNode)

    return record
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

  return {...record, nodes: toUuidIndexedObj(nodes)}
}

/**
 * ===================
 * UPDATE
 * ===================
 */

const persistNode = (user, surveyId, node, file) => RecordUpdateManager.persistNode(user, surveyId, node, file)

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
const checkInRecord = async (userId, surveyId, recordId) => {
  RecordUpdateManager.checkIn(userId)
  return await fetchRecordById(surveyId, recordId)
}

const checkOutRecord = RecordUpdateManager.checkOut

module.exports = {
  //==== CREATE
  createRecord,

  //==== READ
  countRecordsBySurveyId: RecordRepository.countRecordsBySurveyId,
  fetchRecordsSummaryBySurveyId,
  fetchNodeFileByUuid: NodeRepository.fetchNodeFileByUuid,

  //==== UPDATE
  persistNode,

  //==== DELETE
  deleteRecord,
  deleteNode,

  //==== UTILS
  checkInRecord,
  checkOutRecord,
}
