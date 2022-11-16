import * as R from 'ramda'

import { SystemError } from '@openforis/arena-core'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as ObjectUtils from '@core/objectUtils'

import { db } from '@server/db/db'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as CategoryRepository from '@server/modules/category/repository/categoryRepository'
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

const _insertRecordAndCreateNodes = async ({ user, survey, cycle }, tx) => {
  const recordToInsert = Record.newRecord(user, cycle)

  const surveyId = Survey.getId(survey)
  const record = await insertRecord(user, surveyId, recordToInsert, false, tx)

  const { record: recordWithNodes } = await Record.createRootEntity({
    survey,
    record,
  })
  return recordWithNodes
}

const _fetchCategoryItemAndAncestors = async ({ surveyId, itemUuid }, tx) => {
  const items = []
  let currentItemUuid = itemUuid
  while (currentItemUuid) {
    const categoryItem = await CategoryRepository.fetchItemByUuid({ surveyId, uuid: currentItemUuid }, tx)
    items.unshift(categoryItem)
    currentItemUuid = CategoryItem.getParentUuid(categoryItem)
  }
  return items
}

const _fetchKeyValuesBySamplingPointDataItem = async ({ survey, itemUuid }, tx) => {
  const valuesByDefUuid = {}

  const surveyId = Survey.getId(survey)

  const categoryItemAndAncestors = await _fetchCategoryItemAndAncestors({ surveyId, itemUuid }, tx)
  if (categoryItemAndAncestors.length === 0) throw new SystemError('category.itemNotFound', { itemUuid })

  const keyDefs = Survey.getNodeDefRootKeys(survey)
  keyDefs.forEach((keyDef) => {
    // key def must be a code attribute using the sampling point data category
    const levelIndex = Survey.getNodeDefCategoryLevelIndex(keyDef)(survey)

    const categoryItemForKey = categoryItemAndAncestors[levelIndex]
    if (!categoryItemForKey)
      throw new SystemError('record.fromSamplingPointData.itemForKeyNotFound', { keyDef: NodeDef.getName(keyDef) })

    valuesByDefUuid[NodeDef.getUuid(keyDef)] = Node.newNodeValueCode({
      itemUuid: CategoryItem.getUuid(categoryItemForKey),
    })
  })
  return valuesByDefUuid
}

export const createRecordFromSamplingPointDataItem = async ({ user, survey, cycle, itemUuid }, client = db) =>
  client.tx(async (tx) => {
    if (!Survey.canRecordBeIdentifiedBySamplingPointDataItem(survey))
      throw new SystemError('record.fromSamplingPointData.cannotCreateRecords')

    const surveyId = Survey.getId(survey)

    const record = await _insertRecordAndCreateNodes({ user, survey, cycle }, tx)

    const valuesByDefUuid = await _fetchKeyValuesBySamplingPointDataItem({ survey, itemUuid }, tx)

    const rootDef = Survey.getNodeDefRoot(survey)

    // update record and validate nodes
    const recordUpdateResult = await Record.updateAttributesWithValues({
      survey,
      entityDefUuid: NodeDef.getUuid(rootDef),
      valuesByDefUuid,
      insertMissingNodes: true,
    })(record)

    const recordUpdated = recordUpdateResult.record

    // insert nodes following hierarchy
    const nodesArray = Record.getNodesArray(recordUpdated)
    nodesArray.sort((nodeA, nodeB) => Node.getHierarchy(nodeA).length - Node.getHierarchy(nodeB).length)
    await insertNodesInBulk({ user, surveyId, nodesArray }, tx)

    const recordUuid = Record.getUuid(recordUpdated)
    await RecordRepository.updateValidation(surveyId, recordUuid, recordUpdated.validation, tx)

    // validate and update RDB
    // set "created" = true into new nodes so that the RDB updater will work properly;
    // do side effect so even the record object will have updated nodes
    nodesArray.forEach((node) => {
      node[Node.keys.created] = true
    })
    const nodesToPersist = ObjectUtils.toUuidIndexedObj(nodesArray)
    await RecordUpdateManager.persistNodesToRDB({ survey, record: recordUpdated, nodes: nodesToPersist }, tx)

    return recordUuid
  })

export const insertNodesInBulk = async ({ user, surveyId, nodesArray, systemActivity = false }, tx) => {
  const nodeValues = nodesArray.map((node) => [
    Node.getUuid(node),
    Node.getDateCreated(node),
    Node.getDateCreated(node),
    Node.getRecordUuid(node),
    Node.getParentUuid(node),
    Node.getNodeDefUuid(node),
    JSON.stringify(Node.getValue(node, null)),
    Node.getMeta(node),
  ])

  await NodeRepository.insertNodesFromValues(surveyId, nodeValues, tx)

  const activities = nodesArray.map((node) =>
    ActivityLog.newActivity(ActivityLog.type.nodeCreate, node, systemActivity)
  )
  await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
}

export const insertNodesInBatch = async ({ user, surveyId, nodes, systemActivity = false }, tx) => {
  await NodeRepository.insertNodesInBatch({ surveyId, nodes }, tx)
  const activities = nodes.map((node) => ActivityLog.newActivity(ActivityLog.type.nodeCreate, node, systemActivity))
  await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
}

export const { insertNode } = RecordUpdateManager

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
  { surveyId, recordUuid, draft = true, fetchForUpdate = true },
  client = db
) => {
  const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, client)
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
  validateNodesAndPersistToRDB,
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
  updateRecordValidationsFromValues,
  validateNodesAndPersistValidation,
} from './_recordManager/recordValidationManager'

export {
  exportValidationReportToStream,
  fetchValidationReport,
  countValidationReportItems,
} from './_recordManager/validationReportManager'
