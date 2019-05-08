const db = require('../../../db/db')

const Record = require('../../../../common/record/record')
const SurveyUtils = require('../../../../common/survey/surveyUtils')

const NodeDefRepository = require('../../nodeDef/repository/nodeDefRepository')
const RecordRepository = require('./recordRepository')
const NodeRepository = require('./nodeRepository')

const fetchRecordsSummaryBySurveyId = async (surveyId, offset, limit, client = db) => {
  const nodeDefKeys = await NodeDefRepository.fetchRootNodeDefKeysBySurveyId(surveyId, false, client)
  const nodeDefRoot = await NodeDefRepository.fetchRootNodeDef(surveyId, false, client)
  const records = await RecordRepository.fetchRecordsSummaryBySurveyId(surveyId, nodeDefRoot, nodeDefKeys, offset, limit, client)

  return {
    nodeDefKeys,
    records
  }
}

const fetchRecordByUuid = async (surveyId, recordUuid, client = db) =>
  await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, client)

const fetchRecordAndNodesByUuid = async (surveyId, recordUuid, client = db) => {
  const record = await fetchRecordByUuid(surveyId, recordUuid, client)
  const nodes = await NodeRepository.fetchNodesByRecordUuid(surveyId, recordUuid, client)

  return Record.assocNodes(SurveyUtils.toUuidIndexedObj(nodes))(record)
}

module.exports = {
  // CREATE
  insertRecord: RecordRepository.insertRecord,
  insertNodes: NodeRepository.insertNodes,

  // READ
  fetchRecordByUuid,
  fetchRecordAndNodesByUuid,
  fetchRecordsSummaryBySurveyId,
  fetchRecordUuids: RecordRepository.fetchRecordUuids,
  countRecordsBySurveyId: RecordRepository.countRecordsBySurveyId,

  fetchNodeByUuid: NodeRepository.fetchNodeByUuid,
  fetchChildNodeByNodeDefUuid: NodeRepository.fetchChildNodeByNodeDefUuid,
  fetchChildNodesByNodeDefUuid: NodeRepository.fetchChildNodesByNodeDefUuid,

  // UTILS
  disableTriggers: NodeRepository.disableTriggers,
  enableTriggers: NodeRepository.enableTriggers
}
