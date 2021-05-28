import * as R from 'ramda'

import Queue from '@core/queue'

import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as PromiseUtils from '@core/promiseUtils'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import { db } from '@server/db/db'
import * as NodeRepository from '../../repository/nodeRepository'
import * as NodeUpdateDependentManager from './nodeUpdateDependentManager'

const _createUpdateResult = (record, node, nodes) => {
  const recordUpdated = Record.assocNodes(nodes)(record)

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

const _onNodeUpdate = async (survey, record, node, nodeDependents, t) => {
  // TODO check if it should be removed
  const surveyId = Survey.getId(survey)

  let updatedNodes = nodeDependents || {}

  // Delete dependent code nodes
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  if (NodeDef.isCode(nodeDef)) {
    const nodesDependent = Record.getDependentCodeAttributes(node)(record)

    if (!R.isEmpty(nodesDependent)) {
      const nodesClearedArray = await Promise.all(
        nodesDependent.map((nodeDependent) => {
          const nodeDefDependent = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeDependent))(survey)

          return NodeDef.isMultiple(nodeDefDependent)
            ? NodeRepository.deleteNode(surveyId, Node.getUuid(nodeDependent), t)
            : NodeRepository.updateNode(
                surveyId,
                Node.getUuid(nodeDependent),
                null,
                Node.getMeta(nodeDependent),
                Record.isPreview(record),
                t
              )
        })
      )
      updatedNodes = {
        ...updatedNodes,
        ...ObjectUtils.toUuidIndexedObj(nodesClearedArray),
      }
    }
  }

  return _createUpdateResult(record, node, updatedNodes)
}

// ==== CREATE

const _insertNodeRecursively = async (user, survey, nodeDef, record, nodeToInsert, system, t) => {
  const surveyId = Survey.getId(survey)

  if (!Record.isPreview(record)) {
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeCreate, nodeToInsert, system, t)
  }

  // Insert node
  const node = await NodeRepository.insertNode(surveyId, nodeToInsert, Record.isPreview(record), t)

  const recordUpdated = Record.assocNode(node)(record)

  // Add children if entity
  const childDefs = NodeDef.isEntity(nodeDef) ? Survey.getNodeDefChildren(nodeDef)(survey) : []

  // Insert only child single nodes (it allows to apply default values)
  const childNodes = {}
  await PromiseUtils.each(childDefs, async (childDef) => {
    if (NodeDef.isSingle(childDef)) {
      const childNode = Node.newNode(NodeDef.getUuid(childDef), Node.getRecordUuid(node), node)
      const childNodesInserted = await _insertNodeRecursively(user, survey, childDef, recordUpdated, childNode, true, t)
      Object.assign(childNodes, childNodesInserted)
    }
  })

  return {
    ...childNodes,
    [Node.getUuid(node)]: node,
  }
}

export const insertNode = async (user, survey, record, node, system, t) => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  // If it's a code, don't insert if it has been inserted already (by another user)
  if (NodeDef.isCode(nodeDef)) {
    const nodeParent = Record.getParentNode(node)(record)
    const siblings = Record.getNodeChildrenByDefUuid(nodeParent, Node.getNodeDefUuid(node))(record)
    if (R.any((sibling) => R.equals(Node.getValue(sibling), Node.getValue(node)))(siblings)) {
      return {}
    }
  }

  const nodesToReturn = await _insertNodeRecursively(user, survey, nodeDef, record, node, system, t)

  return _createUpdateResult(record, node, nodesToReturn)
}

// ==== UPDATE

export const updateNode = async (user, survey, record, node, system, t) => {
  const surveyId = Survey.getId(survey)
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  const meta = { ...Node.getMeta(node) }

  if (NodeDef.isAttribute(nodeDef)) {
    // reset default value applied flag
    meta[Node.metaKeys.defaultValue] = false
  }
  if (!Record.isPreview(record)) {
    // Keep only node uuid, recordUuid, meta and value
    const logContent = R.pipe(
      R.pick([Node.keys.uuid, Node.keys.recordUuid, Node.keys.nodeDefUuid, Node.keys.value]),
      R.assoc(Node.keys.meta, meta)
    )(node)
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeValueUpdate, logContent, system, t)
  }

  const nodeUpdated = await NodeRepository.updateNode(
    surveyId,
    Node.getUuid(node),
    Node.getValue(node),
    meta,
    Record.isPreview(record),
    t
  )

  const recordUpdated = Record.assocNode(nodeUpdated)(record)

  return _onNodeUpdate(survey, recordUpdated, nodeUpdated, {}, t)
}

export const persistNode = async (user, survey, record, node, system, t) => {
  const nodeUuid = Node.getUuid(node)

  const existingNode = Record.getNodeByUuid(nodeUuid)(record)

  if (existingNode) {
    // Updating existing node
    return updateNode(user, survey, record, node, system, t)
  }
  // Inserting new node
  return insertNode(user, survey, record, node, system, t)
}

/**
 * Nodes can be visited maximum 2 times during the update of the dependent nodes, to avoid loops in the evaluation.
 * The first time the applicability can depend on attributes with default values not applied yet.
 * The second time the applicability expression can be evaluated correctly.
 */
const MAX_VISITING_TIMES = 2

export const updateNodesDependents = async (survey, record, nodes, tx) => {
  // Output
  const nodesUpdated = { ...nodes }

  const nodesToVisit = new Queue(R.values(nodes))

  const visitedCountByUuid = {} // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)

  let recordUpdated = record

  while (!nodesToVisit.isEmpty()) {
    const node = nodesToVisit.dequeue()
    const nodeUuid = Node.getUuid(node)

    const visitedCount = visitedCountByUuid[nodeUuid] || 0

    if (visitedCount < MAX_VISITING_TIMES) {
      // Update node dependents (applicability)
      const nodesApplicability = await NodeUpdateDependentManager.updateSelfAndDependentsApplicable(
        survey,
        recordUpdated,
        node,
        tx
      )
      recordUpdated = Record.assocNodes(nodesApplicability)(recordUpdated)

      // Update node dependents (default values)
      const nodesDefaultValues = await NodeUpdateDependentManager.updateSelfAndDependentsDefaultValues(
        survey,
        recordUpdated,
        node,
        tx
      )
      recordUpdated = Record.assocNodes(nodesDefaultValues)(recordUpdated)

      // Update record nodes
      const nodesUpdatedCurrent = {
        ...nodesApplicability,
        ...nodesDefaultValues,
      }

      // Mark updated nodes to visit
      nodesToVisit.enqueueItems(Object.values(nodesUpdatedCurrent))

      // Update nodes to return
      Object.assign(nodesUpdated, nodesUpdatedCurrent)

      // Mark node visited
      visitedCountByUuid[nodeUuid] = visitedCount + 1
    }
  }

  return {
    record: recordUpdated,
    nodes: nodesUpdated,
  }
}

// ==== DELETE

const _getNodeDependentKeyAttributes = (survey, record, node) => {
  const nodeDependentKeyAttributes = {}
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  if (NodeDef.isMultipleEntity(nodeDef)) {
    // Find sibling entities with same key values
    const nodeDeletedKeyValues = Record.getEntityKeyValues(survey, node)(record)
    if (!R.isEmpty(nodeDeletedKeyValues)) {
      const nodeParent = Record.getParentNode(node)(record)
      const nodeSiblings = R.pipe(
        Record.getNodeChildrenByDefUuid(nodeParent, NodeDef.getUuid(nodeDef)),
        R.reject(ObjectUtils.isEqual(node))
      )(record)

      nodeSiblings.forEach((nodeSibling) => {
        const nodeKeys = Record.getEntityKeyNodes(survey, nodeSibling)(record)
        // If key nodes are the same as the ones of the deleted node,
        // add them to the accumulator
        const nodeKeyValues = R.map(Node.getValue)(nodeKeys)

        if (R.equals(nodeKeyValues, nodeDeletedKeyValues)) {
          nodeKeys.forEach((nodeKey) => {
            nodeDependentKeyAttributes[Node.getUuid(nodeKey)] = nodeKey
          })
        }
      })
    }
  }

  return nodeDependentKeyAttributes
}

export const deleteNode = async (user, survey, record, nodeUuid, t) => {
  const surveyId = Survey.getId(survey)

  const node = await NodeRepository.deleteNode(surveyId, nodeUuid, t)

  if (!Record.isPreview(record)) {
    const logContent = {
      [ActivityLog.keysContent.uuid]: nodeUuid,
      [ActivityLog.keysContent.recordUuid]: Node.getRecordUuid(node),
      [ActivityLog.keysContent.nodeDefUuid]: Node.getNodeDefUuid(node),
      [Node.keys.meta]: {
        [Node.metaKeys.hierarchy]: Node.getHierarchy(node),
      },
    }
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeDelete, logContent, false, t)
  }

  // Get dependent key attributes before node is removed from record
  // and return them so they will be re-validated later on
  const nodeDependentKeyAttributes = _getNodeDependentKeyAttributes(survey, record, node)

  const nodeDependentUniqueAttributes = Record.getAttributesUniqueDependent({ survey, record, node })

  const recordUpdated = Record.assocNode(node)(record)

  return _onNodeUpdate(
    survey,
    recordUpdated,
    node,
    { ...nodeDependentKeyAttributes, ...nodeDependentUniqueAttributes },
    t
  )
}

export const deleteNodesByNodeDefUuids = async (user, surveyId, nodeDefsUuids, record, client = db) =>
  client.tx(async (t) => {
    const nodesDeleted = await NodeRepository.deleteNodesByNodeDefUuids(surveyId, nodeDefsUuids, t)
    const activities = nodesDeleted.map((node) =>
      ActivityLog.newActivity(ActivityLog.type.nodeDelete, { uuid: Node.getUuid(node) }, true)
    )
    await ActivityLogRepository.insertMany(user, surveyId, activities, t)
    return Record.assocNodes(ObjectUtils.toUuidIndexedObj(nodesDeleted))(record)
  })
