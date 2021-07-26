import * as camelize from 'camelize'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as ObjectUtils from '@core/objectUtils'

import { db } from '@server/db/db'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as RecordRepository from '../repository/recordRepository'
import * as NodeRepository from '../repository/nodeRepository'
import * as RecordUpdateManager from './_recordManager/recordUpdateManager'

// ==== CREATE

export const insertRecord = async (user, surveyId, record, system = false, client = db) =>
  client.tx(async (t) => {
    const recordDb = await RecordRepository.insertRecord(surveyId, record, t)
    if (!Record.isPreview(record)) {
      await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.recordCreate, record, system, t)
    }

    return recordDb
  })

export const insertNodesFromValues = async (user, surveyId, nodeValues, client = db) => {
  const activities = nodeValues.map((nodeValuesRow) => {
    const node = NodeRepository.tableColumns.reduce(
      (accContent, key, index) => Object.assign(accContent, { [camelize(key)]: nodeValuesRow[index] }),
      {}
    )
    return ActivityLog.newActivity(ActivityLog.type.nodeCreate, node, true)
  })

  await client.tx(async (t) =>
    Promise.all([
      NodeRepository.insertNodesFromValues(surveyId, nodeValues, t),
      ActivityLogRepository.insertMany(user, surveyId, activities, t),
    ])
  )
}

export const { insertNode } = RecordUpdateManager

// ==== READ

export const fetchRecordsSummaryBySurveyId = async (
  { surveyId, cycle, offset, limit, sortBy, sortOrder, search },
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
    { surveyId, cycle, nodeDefRoot, nodeDefKeys, offset, limit, sortBy, sortOrder, search },
    client
  )

  return {
    nodeDefKeys,
    list,
  }
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
  fetchRecordByUuid,
  fetchRecordsUuidAndCycle,
  fetchRecordCreatedCountsByDates,
  insertRecordsInBatch,
} from '../repository/recordRepository'

export const fetchRecordAndNodesByUuid = async (surveyId, recordUuid, draft = true, client = db) => {
  const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, client)
  const nodes = await NodeRepository.fetchNodesByRecordUuid(surveyId, recordUuid, draft, client)

  return Record.assocNodes(ObjectUtils.toUuidIndexedObj(nodes))(record)
}

export { fetchNodeByUuid, fetchChildNodesByNodeDefUuids, insertNodesInBatch } from '../repository/nodeRepository'

// ==== UPDATE

export {
  initNewRecord,
  updateRecordStep,
  persistNode,
  updateNode,
  updateNodesDependents,
} from './_recordManager/recordUpdateManager'

// ==== DELETE

export {
  deleteRecord,
  deleteRecordPreview,
  deleteRecordsPreview,
  deleteRecordsByCycles,
  deleteRecordsBySurvey,
  deleteNode,
  deleteNodesByNodeDefUuids,
} from './_recordManager/recordUpdateManager'

// ==== VALIDATION
export {
  persistValidation,
  updateRecordValidationsFromValues,
  validateNodesAndPersistValidation,
} from './_recordManager/recordValidationManager'

export { fetchValidationReport, countValidationReports } from './_recordManager/validationReportManager'
