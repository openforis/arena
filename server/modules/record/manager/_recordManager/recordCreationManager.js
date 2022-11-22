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
import * as CategoryRepository from '@server/modules/category/repository/categoryRepository'
import * as RecordRepository from '../../repository/recordRepository'
import * as RecordUpdateManager from './recordUpdateManager'
import * as NodeCreationManager from './nodeCreationManager'

export const insertRecord = async (user, surveyId, record, system = false, client = db) =>
  client.tx(async (t) => {
    const recordDb = await RecordRepository.insertRecord(surveyId, record, t)
    if (!Record.isPreview(record)) {
      await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.recordCreate, record, system, t)
    }
    return recordDb
  })

const _createRecordAndNodes = async ({ user, survey, cycle }) => {
  const record = Record.newRecord(user, cycle)
  const { record: recordWithNodes } = await Record.createRootEntity({ survey, record })
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

    const record = await _createRecordAndNodes({ user, survey, cycle })
    await insertRecord(user, surveyId, record, false, tx)

    const valuesByDefUuid = await _fetchKeyValuesBySamplingPointDataItem({ survey, itemUuid }, tx)

    const rootDef = Survey.getNodeDefRoot(survey)

    // update record and validate nodes
    const { record: recordUpdated } = await Record.updateAttributesWithValues({
      survey,
      entityDefUuid: NodeDef.getUuid(rootDef),
      valuesByDefUuid,
      insertMissingNodes: true,
    })(record)

    // insert nodes following hierarchy
    const nodesArray = Record.getNodesArray(recordUpdated)
    nodesArray.sort((nodeA, nodeB) => Node.getHierarchy(nodeA).length - Node.getHierarchy(nodeB).length)
    await NodeCreationManager.insertNodesInBulk({ user, surveyId, nodesArray }, tx)

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
