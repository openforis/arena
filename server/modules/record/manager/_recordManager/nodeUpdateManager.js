import * as R from 'ramda'

import Queue from '@core/queue'

import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as NodeRepository from '../../repository/nodeRepository'
import * as NodeUpdateDependentManager from './nodeUpdateDependentManager'

// ==== UPDATE

export const persistNode = async (user, survey, record, node, system, t) => {
  const nodeUuid = Node.getUuid(node)

  const existingNode = Record.getNodeByUuid(nodeUuid)(record)

  if (existingNode) {
    // Updating existing node
    const surveyId = Survey.getId(survey)
    const nodeValue = Node.getValue(node)
    const meta = {
      ...Node.getMeta(node),
      [Node.metaKeys.defaultValue]: false,
    }
    if (!Record.isPreview(record)) {
      // Keep only node uuid, recordUuid, meta and value
      const logContent = R.pipe(
        R.pick([
          Node.keys.uuid,
          Node.keys.recordUuid,
          Node.keys.nodeDefUuid,
          Node.keys.value,
        ]),
        R.assoc(Node.keys.meta, meta),
      )(node)
      await ActivityLogRepository.insert(
        user,
        surveyId,
        ActivityLog.type.nodeValueUpdate,
        logContent,
        system,
        t,
      )
    }

    const nodeUpdate = await NodeRepository.updateNode(
      surveyId,
      nodeUuid,
      nodeValue,
      meta,
      Record.isPreview(record),
      t,
    )

    record = Record.assocNode(nodeUpdate)(record)

    return await _onNodeUpdate(survey, record, nodeUpdate, {}, t)
  }

  // Inserting new node
  return await insertNode(user, survey, record, node, system, t)
}

export const updateNodesDependents = async (survey, record, nodes, tx) => {
  // Output
  const nodesUpdated = {...nodes}

  const nodesArray = Object.values(nodes)
  const nodesToVisit = new Queue(nodesArray)

  const nodesVisitedByUuid = {} // Used to avoid visiting the same node 2 times

  while (!nodesToVisit.isEmpty()) {
    const node = nodesToVisit.dequeue()
    const nodeUuid = Node.getUuid(node)

    // Visit only unvisited nodes
    if (!nodesVisitedByUuid[nodeUuid]) {
      // Update node dependents
      const [nodesApplicability, nodesDefaultValues] = await Promise.all([
        NodeUpdateDependentManager.updateDependentsApplicable(
          survey,
          record,
          node,
          tx,
        ),
        NodeUpdateDependentManager.updateDependentsDefaultValues(
          survey,
          record,
          node,
          tx,
        ),
      ])

      // Update record nodes
      const nodesUpdatedCurrent = {
        ...nodesApplicability,
        ...nodesDefaultValues,
      }
      record = Record.assocNodes(nodesUpdatedCurrent)(record)

      // Mark updated nodes to visit
      nodesToVisit.enqueueItems(Object.values(nodesUpdatedCurrent))

      // Update nodes to return
      Object.assign(nodesUpdated, nodesUpdatedCurrent)

      // Mark node visited
      nodesVisitedByUuid[nodeUuid] = true
    }
  }

  return {
    record,
    nodes: nodesUpdated,
  }
}

// ==== CREATE
export const insertNode = async (user, survey, record, node, system, t) => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  // If it's a code, don't insert if it has been inserted already (by another user)
  if (NodeDef.isCode(nodeDef)) {
    const nodeParent = Record.getParentNode(node)(record)
    const siblings = Record.getNodeChildrenByDefUuid(
      nodeParent,
      Node.getNodeDefUuid(node),
    )(record)
    if (
      R.any(sibling => R.equals(Node.getValue(sibling), Node.getValue(node)))(
        siblings,
      )
    ) {
      return {}
    }
  }

  const nodesToReturn = await _insertNodeRecursively(
    user,
    survey,
    nodeDef,
    record,
    node,
    system,
    t,
  )

  return _createUpdateResult(record, node, nodesToReturn)
}

const _insertNodeRecursively = async (
  user,
  survey,
  nodeDef,
  record,
  nodeToInsert,
  system,
  t,
) => {
  const surveyId = Survey.getId(survey)

  if (!Record.isPreview(record)) {
    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.nodeCreate,
      nodeToInsert,
      system,
      t,
    )
  }

  // Insert node
  const node = await NodeRepository.insertNode(
    surveyId,
    nodeToInsert,
    Record.isPreview(record),
    t,
  )

  record = Record.assocNode(node)(record)

  // Add children if entity
  const childDefs = NodeDef.isEntity(nodeDef)
    ? Survey.getNodeDefChildren(nodeDef)(survey)
    : []

  // Insert only child single nodes (it allows to apply default values)
  const childNodes = {}
  for (const childDef of childDefs) {
    if (NodeDef.isSingle(childDef)) {
      const childNode = Node.newNode(
        NodeDef.getUuid(childDef),
        Node.getRecordUuid(node),
        node,
      )
      const childNodesInserted = await _insertNodeRecursively(
        user,
        survey,
        childDef,
        record,
        childNode,
        true,
        t,
      )
      Object.assign(childNodes, childNodesInserted)
    }
  }

  return {
    ...childNodes,
    [Node.getUuid(node)]: node,
  }
}

// ==== DELETE

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
    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.nodeDelete,
      logContent,
      false,
      t,
    )
  }

  // Get dependent key attributes before node is removed from record
  // and return them so they will be re-validated later on
  const nodeDependentKeyAttributes = _getNodeDependentKeyAttributes(
    survey,
    record,
    node,
  )

  record = Record.assocNode(node)(record)

  return await _onNodeUpdate(
    survey,
    record,
    node,
    nodeDependentKeyAttributes,
    t,
  )
}

export const deleteNodesByNodeDefUuids = async (
  user,
  surveyId,
  nodeDefsUuids,
  record,
  client = db,
) =>
  await client.tx(async t => {
    const nodesDeleted = await NodeRepository.deleteNodesByNodeDefUuids(
      surveyId,
      nodeDefsUuids,
      t,
    )
    const activities = nodesDeleted.map(node =>
      ActivityLog.newActivity(
        ActivityLog.type.nodeDelete,
        {uuid: Node.getUuid(node)},
        true,
      ),
    )
    await ActivityLogRepository.insertMany(user, surveyId, activities, t)
    return Record.assocNodes(ObjectUtils.toUuidIndexedObj(nodesDeleted))(record)
  })

const _onNodeUpdate = async (survey, record, node, nodeDependents = {}, t) => {
  // TODO check if it should be removed
  const surveyId = Survey.getId(survey)

  let updatedNodes = nodeDependents

  // Delete dependent code nodes
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  if (NodeDef.isCode(nodeDef)) {
    const dependentCodes = Record.getDependentCodeAttributes(node)(record)

    if (!R.isEmpty(dependentCodes)) {
      const deletedNodesArray = await Promise.all(
        dependentCodes.map(nodeCode =>
          NodeRepository.deleteNode(surveyId, Node.getUuid(nodeCode), t),
        ),
      )
      updatedNodes = {
        ...updatedNodes,
        ...ObjectUtils.toUuidIndexedObj(deletedNodesArray),
      }
    }
  }

  return _createUpdateResult(record, node, updatedNodes)
}

const _createUpdateResult = (record, node, nodes) => {
  record = Record.assocNodes(nodes)(record)

  const parentNode = Record.getParentNode(node)(record)

  return {
    record,
    nodes: {
      [Node.getUuid(node)]: node,
      // Always assoc parentNode, used in surveyRdbManager.updateTableNodes
      ...(parentNode ? {[Node.getUuid(parentNode)]: parentNode} : {}),
      ...nodes,
    },
  }
}

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
        R.reject(ObjectUtils.isEqual(node)),
      )(record)

      nodeSiblings.forEach(nodeSibling => {
        const nodeKeys = Record.getEntityKeyNodes(survey, nodeSibling)(record)
        // If key nodes are the same as the ones of the deleted node,
        // add them to the accumulator
        const nodeKeyValues = R.map(Node.getValue)(nodeKeys)

        if (R.equals(nodeKeyValues, nodeDeletedKeyValues)) {
          nodeKeys.forEach(
            nodeKey =>
              (nodeDependentKeyAttributes[Node.getUuid(nodeKey)] = nodeKey),
          )
        }
      })
    }
  }

  return nodeDependentKeyAttributes
}
