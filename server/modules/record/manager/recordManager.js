import * as camelize from 'camelize'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as ObjectUtils from '@core/objectUtils'

import { db } from '@server/db/db'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as RecordUpdateManager from './_recordManager/recordUpdateManager'
import * as RecordValidationManager from './_recordManager/recordValidationManager'

import * as SurveyRepository from '../../survey/repository/surveyRepository'
import * as NodeDefRepository from '../../nodeDef/repository/nodeDefRepository'
import * as RecordRepository from '../repository/recordRepository'
import * as NodeRepository from '../repository/nodeRepository'

//CREATE
export const insertRecord = async (user, surveyId, record, system = false, client = db) =>
  await client.tx(async t => {
    const recordDb = await RecordRepository.insertRecord(surveyId, record, t)
    if (!Record.isPreview(record)) {
      await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.recordCreate, record, system, t)
    }
    return recordDb
  })

export const insertNodesFromValues = async (user, surveyId, nodeValues, client = db) => {
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

export const insertNode = RecordUpdateManager.insertNode

//READ
export const fetchRecordsSummaryBySurveyId = async (surveyId, cycle, offset, limit, client = db) => {
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

export const fetchRecordByUuid = async (surveyId, recordUuid, client = db) =>
  await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, client)

export const fetchRecordAndNodesByUuid = async (surveyId, recordUuid, draft = true, client = db) => {
  const record = await fetchRecordByUuid(surveyId, recordUuid, client)
  const nodes = await NodeRepository.fetchNodesByRecordUuid(surveyId, recordUuid, draft, client)

  return Record.assocNodes(ObjectUtils.toUuidIndexedObj(nodes))(record)
}

export const fetchRecordsUuidAndCycle = RecordRepository.fetchRecordsUuidAndCycle
export const countRecordsBySurveyId = RecordRepository.countRecordsBySurveyId
export const fetchRecordCreatedCountsByDates = RecordRepository.fetchRecordCreatedCountsByDates

export const fetchNodeByUuid = NodeRepository.fetchNodeByUuid
export const fetchChildNodesByNodeDefUuids = NodeRepository.fetchChildNodesByNodeDefUuids

// ==== UPDATE
export const initNewRecord = RecordUpdateManager.initNewRecord
export const updateRecordStep = RecordUpdateManager.updateRecordStep
export const persistNode = RecordUpdateManager.persistNode
export const updateNodesDependents = RecordUpdateManager.updateNodesDependents

// ==== DELETE
export const deleteRecord = RecordUpdateManager.deleteRecord
export const deleteRecordPreview = RecordUpdateManager.deleteRecordPreview
export const deleteRecordsPreview = RecordUpdateManager.deleteRecordsPreview
export const deleteNode = RecordUpdateManager.deleteNode
export const deleteNodesByNodeDefUuids = RecordUpdateManager.deleteNodesByNodeDefUuids
export const deleteRecordsByCycles = RecordUpdateManager.deleteRecordsByCycles

// ==== VALIDATION
export const persistValidation = RecordValidationManager.persistValidation
export const updateRecordValidationsFromValues = RecordValidationManager.updateRecordValidationsFromValues
export const validateNodesAndPersistValidation = RecordValidationManager.validateNodesAndPersistValidation
