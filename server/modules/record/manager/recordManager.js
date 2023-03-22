import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as ObjectUtils from '@core/objectUtils'

import { db } from '@server/db/db'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as RecordRepository from '../repository/recordRepository'
import * as NodeRepository from '../repository/nodeRepository'
import * as RecordUpdateManager from './_recordManager/recordUpdateManager'

// ==== CREATE

export { insertRecord, createRecordFromSamplingPointDataItem } from './_recordManager/recordCreationManager'
export { insertNodesInBatch, insertNodesInBulk } from './_recordManager/nodeCreationManager'

export const { insertNode, persistNodesToRDB } = RecordUpdateManager

// ==== READ

export const fetchRecordsSummaryBySurveyId = async (
  { surveyId, cycle, offset, limit, sortBy, sortOrder, search, step = null, recordUuid = null },
  client = db
) => {
  const surveyInfo = await SurveyRepository.fetchSurveyById({ surveyId, draft: true }, client)
  const nodeDefsDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  const nodeDefRoot = await NodeDefRepository.fetchRootNodeDef(surveyId, nodeDefsDraft, client)
  const nodeDefKeys = await NodeDefRepository.fetchRootNodeDefKeysBySurveyId(
    surveyId,
    NodeDef.getUuid(nodeDefRoot),
    nodeDefsDraft,
    client
  )

  const list = await RecordRepository.fetchRecordsSummaryBySurveyId(
    { surveyId, cycle, nodeDefRoot, nodeDefKeys, offset, limit, sortBy, sortOrder, search, step, recordUuid },
    client
  )

  return {
    nodeDefKeys,
    list,
  }
}

export const fetchRecordSummary = async ({ surveyId, recordUuid }, client = db) => {
  const { list } = await fetchRecordsSummaryBySurveyId({ surveyId, recordUuid }, client)
  return list[0]
}

export const countRecordsBySurveyId = async ({ surveyId, cycle, search }, client = db) => {
  const surveyInfo = await SurveyRepository.fetchSurveyById({ surveyId, draft: true }, client)
  const nodeDefsDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  const nodeDefRoot = await NodeDefRepository.fetchRootNodeDef(surveyId, nodeDefsDraft, client)
  const nodeDefKeys = await NodeDefRepository.fetchRootNodeDefKeysBySurveyId(
    surveyId,
    NodeDef.getUuid(nodeDefRoot),
    nodeDefsDraft,
    client
  )

  return RecordRepository.countRecordsBySurveyId({ surveyId, cycle, search, nodeDefKeys, nodeDefRoot }, client)
}

export {
  countRecordsBySurveyIdGroupedByStep,
  fetchRecordByUuid,
  fetchRecordsByUuids,
  fetchRecordsUuidAndCycle,
  fetchRecordCreatedCountsByDates,
  insertRecordsInBatch,
} from '../repository/recordRepository'

export const fetchRecordAndNodesByUuid = async (
  { surveyId, recordUuid, draft = false, fetchForUpdate = true },
  client = db
) => {
  const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, client)
  if (!record) return null

  const nodes = await NodeRepository.fetchNodesByRecordUuid(
    { surveyId, recordUuid, includeRefData: fetchForUpdate, draft },
    client
  )

  const indexedNodes = ObjectUtils.toUuidIndexedObj(nodes)
  return Record.assocNodes({ nodes: indexedNodes, updateNodesIndex: fetchForUpdate, sideEffect: true })(record)
}

export { fetchNodeByUuid, fetchChildNodesByNodeDefUuids } from '../repository/nodeRepository'

// ==== UPDATE

export {
  initNewRecord,
  updateRecordStepInTransaction,
  persistNode,
  updateNode,
  updateNodesDependents,
} from './_recordManager/recordUpdateManager'

export const updateRecordsStep = async ({ user, surveyId, cycle, stepFrom, stepTo }, client = db) =>
  client.tx(async (t) => {
    const { list: recordsToMove } = await fetchRecordsSummaryBySurveyId({ surveyId, cycle, step: stepFrom }, t)
    await Promise.all(
      recordsToMove.map((record) => RecordUpdateManager.updateRecordStep({ user, surveyId, record, stepId: stepTo }, t))
    )
    return { count: recordsToMove.length }
  })

export const updateNodes = async ({ user, surveyId, nodes }, client = db) =>
  client.tx(async (t) => {
    const activities = nodes.map((node) => {
      const logContent = R.pick([
        Node.keys.uuid,
        Node.keys.recordUuid,
        Node.keys.parentUuid,
        Node.keys.nodeDefUuid,
        Node.keys.meta,
        Node.keys.value,
      ])(node)
      return ActivityLog.newActivity(ActivityLog.type.nodeValueUpdate, logContent, true)
    })
    await ActivityLogRepository.insertMany(user, surveyId, activities, t)
    await NodeRepository.updateNodes({ surveyId, nodes }, t)
  })

// ==== DELETE

export {
  deleteRecord,
  deleteRecordPreview,
  deleteRecordsPreview,
  deleteRecordsByCycles,
  deleteNode,
  deleteNodesByNodeDefUuids,
} from './_recordManager/recordUpdateManager'

// ==== VALIDATION
export {
  persistValidation,
  mergeAndPersistValidation,
  updateRecordValidationsFromValues,
  validateNodesAndPersistValidation,
} from './_recordManager/recordValidationManager'

export {
  exportValidationReportToStream,
  fetchValidationReport,
  countValidationReportItems,
} from './_recordManager/validationReportManager'
