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
import * as FileRepository from '../repository/fileRepository'
import * as NodeRepository from '../repository/nodeRepository'
import * as RecordUpdateManager from './_recordManager/recordUpdateManager'
import { NodeRdbManager } from './_recordManager/nodeRDBManager'

// ==== CREATE

export { insertRecord, createRecordFromSamplingPointDataItem } from './_recordManager/recordCreationManager'
export { insertNodesInBatch, insertNodesInBulk } from './_recordManager/nodeCreationManager'

export const { insertNode } = RecordUpdateManager
export const { generateRdbUpates, persistNodesToRDB } = NodeRdbManager

// ==== READ

export const fetchRecordsSummaryBySurveyId = async (
  {
    surveyId,
    offset,
    limit,
    sortBy,
    sortOrder,
    cycle = null,
    search = null,
    step = null,
    recordUuid = null,
    includeRootKeyValues = true,
    includePreview = false,
    includeCounts = false,
  },
  client = db
) => {
  const surveyInfo = await SurveyRepository.fetchSurveyById({ surveyId, draft: true }, client)
  const nodeDefsDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  const nodeDefRoot = includeRootKeyValues
    ? await NodeDefRepository.fetchRootNodeDef(surveyId, nodeDefsDraft, client)
    : null
  const nodeDefKeys = includeRootKeyValues
    ? await NodeDefRepository.fetchRootNodeDefKeysBySurveyId(
        surveyId,
        NodeDef.getUuid(nodeDefRoot),
        nodeDefsDraft,
        client
      )
    : null

  const list = await RecordRepository.fetchRecordsSummaryBySurveyId(
    {
      surveyId,
      cycle,
      nodeDefRoot,
      nodeDefKeys,
      offset,
      limit,
      sortBy,
      sortOrder,
      search,
      step,
      recordUuids: recordUuid ? [recordUuid] : null,
      includePreview,
    },
    client
  )

  if (!includeCounts) {
    return {
      nodeDefKeys,
      list,
    }
  }

  const listWithCounts = []
  for await (const recordSummary of list) {
    const recordUuid = Record.getUuid(recordSummary)
    const { count: filesCount, total: filesSize } = await FileRepository.fetchCountAndTotalFilesSize(
      { surveyId, recordUuid },
      client
    )
    const filesMissing = await NodeRepository.countNodesWithMissingFile({ surveyId, recordUuid }, client)

    listWithCounts.push({
      ...recordSummary,
      filesCount,
      filesSize,
      filesMissing,
    })
  }
  return {
    nodeDefKeys,
    list: listWithCounts,
  }
}

export const fetchRecordSummary = async (
  { surveyId, recordUuid, includeRootKeyValues = true, includePreview = false },
  client = db
) => {
  const { list } = await fetchRecordsSummaryBySurveyId(
    { surveyId, recordUuid, includeRootKeyValues, includePreview },
    client
  )
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
  fetchRecordCreatedCountsByDatesAndUser,
  fetchRecordCreatedCountsByUser,
  fetchRecordCountsByStep,
  insertRecordsInBatch,
  updateRecordDateModifiedFromValues,
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

export const updateRecordsStep = async ({ user, surveyId, cycle, stepFrom, stepTo, recordUuids }, client = db) =>
  client.tx(async (t) => {
    const recordsSummaryToMove = await RecordRepository.fetchRecordsSummaryBySurveyId(
      {
        surveyId,
        cycle,
        step: stepFrom,
        recordUuids,
      },
      client
    )
    await Promise.all(
      recordsSummaryToMove.map((record) =>
        RecordUpdateManager.updateRecordStep({ user, surveyId, record, stepId: stepTo }, t)
      )
    )
    return { count: recordsSummaryToMove.length }
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

export { updateRecordDateModified, updateRecordsOwner } from '../repository/recordRepository'

export const updateRecordOwner = async ({ user, surveyId, recordUuid, ownerUuid }, client = db) =>
  client.tx(async (t) => {
    const logContent = { recordUuid, ownerUuid }
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.recordOwnerUpdate, logContent, false, t)
    await RecordRepository.updateRecordOwner({ surveyId, recordUuid, ownerUuid }, t)
  })

// ==== DELETE

export {
  deleteRecord,
  deleteRecordPreview,
  deleteRecordsPreview,
  deleteRecordsByCycles,
  deleteNode,
  deleteNodesByNodeDefUuids,
  deleteNodesByUuids,
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
