import { Objects, RecordNodesUpdater } from '@openforis/arena-core'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as NodeRepository from '../../repository/nodeRepository'

const _createUpdateResult = (record, node = null, nodes = {}) => {
  if (!node && Objects.isEmpty(nodes)) {
    return { record, nodes: {} }
  }
  const recordUpdated = Objects.isEmpty(nodes) ? record : Record.mergeNodes(nodes)(record)

  const parentNode = Record.getParentNode(node)(recordUpdated)

  return {
    record: recordUpdated,
    nodes: {
      [Node.getUuid(node)]: node,
      // Always assoc parentNode, used in surveyRdbManager.updateTableNodes
      ...(parentNode ? { [Node.getUuid(parentNode)]: parentNode } : {}),
      ...nodes,
    },
  }
}

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
  const nodesInserted = await NodeRepository.insertNodesInBatch({ surveyId, nodes }, tx)
  const activities = nodes.map((node) => ActivityLog.newActivity(ActivityLog.type.nodeCreate, node, systemActivity))
  await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
  return nodesInserted
}

export const insertNode = async (
  { user, survey, record, node, system, timezoneOffset, persistNodes = true, createMultipleEntities = true },
  t
) => {
  node[Node.keys.created] = true // mark node as created (flag used by RDB manager to update data tables)

  const surveyId = Survey.getId(survey)
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  // If it's a code, don't insert if it has been inserted already (by another user)
  if (NodeDef.isCode(nodeDef)) {
    const parentNode = Record.getParentNode(node)(record)
    const siblings = Record.getNodeChildrenByDefUuid(parentNode, Node.getNodeDefUuid(node))(record)
    if (siblings.some((sibling) => Objects.isEqual(Node.getValue(sibling), Node.getValue(node)))) {
      return _createUpdateResult(record)
    }
  }

  const nodesCreated = {
    [Node.getUuid(node)]: node,
  }
  let recordUpdated = record

  if (NodeDef.isEntity(nodeDef)) {
    const descendantsCreateResult = RecordNodesUpdater.createDescendants({
      survey,
      record,
      parentNode: node,
      nodeDef,
      timezoneOffset,
      createMultipleEntities,
    })
    Object.assign(nodesCreated, descendantsCreateResult.nodes)
    recordUpdated = descendantsCreateResult.record
  }

  const nodesInserted = persistNodes
    ? ObjectUtils.toUuidIndexedObj(
        await insertNodesInBatch({ user, surveyId, nodes: Object.values(nodesCreated), systemActivity: system }, t)
      )
    : nodesCreated

  return _createUpdateResult(recordUpdated, node, nodesInserted)
}
