import db from '../../../db/db';
import Survey from '../../../../core/survey/survey';
import NodeDef from '../../../../core/survey/nodeDef';
import Record from '../../../../core/record/record';
import ObjectUtils from '../../../../core/objectUtils';
import RecordUpdateManager from './_recordManager/recordUpdateManager';
import RecordValidationManager from './_recordManager/recordValidationManager';
import SurveyRepository from '../../survey/repository/surveyRepository';
import NodeDefRepository from '../../nodeDef/repository/nodeDefRepository';
import RecordRepository from '../repository/recordRepository';
import NodeRepository from '../repository/nodeRepository';
import ActivityLog from '../../activityLog/activityLogger';

//CREATE
const insertRecord = async (user, surveyId, record, client: any = db) =>
  await client.tx(async t => {
    const recordDb = await RecordRepository.insertRecord(surveyId, record, t)
    if (!Record.isPreview(record)) {
      await ActivityLog.log(user, surveyId, ActivityLog.type.recordCreate, record, t)
    }
    return recordDb
  })

//READ
const fetchRecordsSummaryBySurveyId = async (surveyId, cycle, offset, limit, client: any = db) => {
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

const fetchRecordByUuid = async (surveyId, recordUuid, client: any = db) =>
  await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, client)

const fetchRecordAndNodesByUuid = async (surveyId, recordUuid, draft = true, client: any = db) => {
  const record = await fetchRecordByUuid(surveyId, recordUuid, client)
  const nodes = await NodeRepository.fetchNodesByRecordUuid(surveyId, recordUuid, draft, client)

  return Record.assocNodes(ObjectUtils.toUuidIndexedObj(nodes))(record)
}

export default {
  // ==== CREATE
  insertRecord,
  insertNodesFromValues: NodeRepository.insertNodesFromValues,
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
};
