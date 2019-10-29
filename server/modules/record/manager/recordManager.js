const camelize = require('camelize')

const ActivityLog = require('@common/activityLog/activityLog')

const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const Record = require('@core/record/record')
const ObjectUtils = require('@core/objectUtils')

const db = require('@server/db/db')
const ActivityLogRepository = require('@server/modules/activityLog/repository/activityLogRepository')

const RecordUpdateManager = require('./_recordManager/recordUpdateManager')
const RecordValidationManager = require('./_recordManager/recordValidationManager')

const SurveyRepository = require('../../survey/repository/surveyRepository')
const NodeDefRepository = require('../../nodeDef/repository/nodeDefRepository')
const RecordRepository = require('../repository/recordRepository')
const NodeRepository = require('../repository/nodeRepository')

//CREATE
const insertRecord = async (user, surveyId, record, system = false, client = db) =>
  await client.tx(async t => {
    const recordDb = await RecordRepository.insertRecord(surveyId, record, t)
    if (!Record.isPreview(record)) {
      await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.recordCreate, record, system, t)
    }
    return recordDb
  })

const insertNodesFromValues = async (user, surveyId, nodeValues, client = db) => {
  const activities = nodeValues.map(nodeValues => {
    const node = NodeRepository.tableColumns.reduce(
      (accContent, key, index) => Object.assign(accContent, { [camelize(key)]: nodeValues[index] }),
      {}
    )
    return ActivityLog.newActivity(ActivityLog.type.nodeCreate, node, true)
  })

  await client.tx(async t => await Promise.all([
    NodeRepository.insertNodesFromValues(surveyId, nodeValues, t),
    ActivityLogRepository.insertMany(user, surveyId, activities, t)
  ]))
}

//READ
const fetchRecordsSummaryBySurveyId = async (surveyId, cycle, offset, limit, client = db) => {
  const surveyInfo = await SurveyRepository.fetchSurveyById(surveyId, true, client)
  const nodeDefsDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  const nodeDefRoot = await NodeDefRepository.fetchRootNodeDef(surveyId, nodeDefsDraft, client)
  const nodeDefKeys = await NodeDefRepository.fetchRootNodeDefKeysBySurveyId(surveyId, NodeDef.getUuid(nodeDefRoot), nodeDefsDraft, client)

  const list = await RecordRepository.fetchRecordsSummaryBySurveyId(surveyId, cycle, nodeDefRoot, nodeDefKeys, offset, limit, client)

  return {
    nodeDefKeys,
    list,
  }
}

const fetchRecordByUuid = async (surveyId, recordUuid, client = db) =>
  await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, client)

const fetchRecordAndNodesByUuid = async (surveyId, recordUuid, draft = true, client = db) => {
  const record = await fetchRecordByUuid(surveyId, recordUuid, client)
  const nodes = await NodeRepository.fetchNodesByRecordUuid(surveyId, recordUuid, draft, client)

  return Record.assocNodes(ObjectUtils.toUuidIndexedObj(nodes))(record)
}

module.exports = {
  // ==== CREATE
  insertRecord,
  insertNodesFromValues,
  insertNode: RecordUpdateManager.insertNode,

  // ==== READ
  fetchRecordByUuid,
  fetchRecordAndNodesByUuid,
  fetchRecordsSummaryBySurveyId,
  fetchRecordsUuidAndCycle: RecordRepository.fetchRecordsUuidAndCycle,
  countRecordsBySurveyId: RecordRepository.countRecordsBySurveyId,
  fetchRecordCreatedCountsByDates: RecordRepository.fetchRecordCreatedCountsByDates,

  fetchNodeByUuid: NodeRepository.fetchNodeByUuid,
  fetchChildNodesByNodeDefUuids: NodeRepository.fetchChildNodesByNodeDefUuids,

  // ==== UPDATE
  initNewRecord: RecordUpdateManager.initNewRecord,
  updateRecordStep: RecordUpdateManager.updateRecordStep,
  persistNode: RecordUpdateManager.persistNode,
  updateNodesDependents: RecordUpdateManager.updateNodesDependents,

  // ==== DELETE
  deleteRecord: RecordUpdateManager.deleteRecord,
  deleteRecordPreview: RecordUpdateManager.deleteRecordPreview,
  deleteRecordsPreview: RecordUpdateManager.deleteRecordsPreview,
  deleteNode: RecordUpdateManager.deleteNode,
  deleteNodesByNodeDefUuids: RecordUpdateManager.deleteNodesByNodeDefUuids,
  deleteRecordsByCycles: RecordUpdateManager.deleteRecordsByCycles,

  // ==== VALIDATION
  persistValidation: RecordValidationManager.persistValidation,
  updateRecordValidationsFromValues: RecordValidationManager.updateRecordValidationsFromValues,
  validateNodesAndPersistValidation: RecordValidationManager.validateNodesAndPersistValidation,

  // ====  UTILS
  disableTriggers: NodeRepository.disableTriggers,
  enableTriggers: NodeRepository.enableTriggers
}
