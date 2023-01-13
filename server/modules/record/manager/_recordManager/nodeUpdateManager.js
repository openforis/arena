import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as ObjectUtils from '@core/objectUtils'
import * as PromiseUtils from '@core/promiseUtils'

import { db } from '@server/db/db'
import * as Log from '@server/log/log'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as NodeRepository from '../../repository/nodeRepository'
import * as FileRepository from '../../repository/fileRepository'

const logger = Log.getLogger('NodeUpdateManager')

const _getNodesToInsert = (nodeDef) => {
  if (NodeDef.isSingle(nodeDef)) return 1
  const validations = NodeDef.getValidations(nodeDef)
  return Number(NodeDefValidations.getMinCount(validations)) || 0
}

const _createUpdateResult = (record, node = null, nodes = {}) => {
  if (!node && R.isEmpty(nodes)) {
    return { record, nodes: {} }
  }
  const recordUpdated = R.isEmpty(nodes) ? record : Record.mergeNodes(nodes)(record)

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
                {
                  surveyId,
                  nodeUuid: Node.getUuid(nodeDependent),
                  meta: Node.getMeta(nodeDependent),
                  draft: Record.isPreview(record),
                },
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

const _insertNodeRecursively = async (
  { user, survey, nodeDef, record, nodeToInsert, system, persistNodes = true, createMultipleEntities = true },
  t
) => {
  const surveyId = Survey.getId(survey)

  if (!Record.isPreview(record) && persistNodes) {
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.nodeCreate, nodeToInsert, system, t)
  }

  // Insert node
  const node = persistNodes
    ? await NodeRepository.insertNode(surveyId, nodeToInsert, Record.isPreview(record), t)
    : nodeToInsert

  const recordUpdated = Record.assocNode(node)(record)

  // Add children if entity
  const childDefs = NodeDef.isEntity(nodeDef) ? Survey.getNodeDefChildren(nodeDef)(survey) : []

  // Insert only child single nodes (it allows to apply default values)
  const descendantNodes = {}
  await PromiseUtils.each(childDefs, async (childDef) => {
    const nodesToInsert = _getNodesToInsert(childDef)
    if (nodesToInsert > 0 && (createMultipleEntities || !NodeDef.isMultipleEntity(childDef))) {
      await PromiseUtils.each([...Array(Number(nodesToInsert)).keys()], async () => {
        const childNode = Node.newNode(NodeDef.getUuid(childDef), Node.getRecordUuid(node), node)
        const descendantNodesInserted = await _insertNodeRecursively(
          {
            user,
            survey,
            nodeDef: childDef,
            record: recordUpdated,
            nodeToInsert: childNode,
            system: true,
            persistNodes,
            createMultipleEntities,
          },
          t
        )
        Object.assign(descendantNodes, descendantNodesInserted)
      })
    }
  })

  return {
    ...descendantNodes,
    [Node.getUuid(node)]: node,
  }
}

export const insertNode = async (
  { user, survey, record, node, system, persistNodes = true, createMultipleEntities = true },
  t
) => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  // If it's a code, don't insert if it has been inserted already (by another user)
  if (NodeDef.isCode(nodeDef)) {
    const nodeParent = Record.getParentNode(node)(record)
    const siblings = Record.getNodeChildrenByDefUuid(nodeParent, Node.getNodeDefUuid(node))(record)
    if (R.any((sibling) => R.equals(Node.getValue(sibling), Node.getValue(node)))(siblings)) {
      return _createUpdateResult(record)
    }
  }

  const nodesToReturn = await _insertNodeRecursively(
    { user, survey, nodeDef, record, nodeToInsert: node, system, persistNodes, createMultipleEntities },
    t
  )

  return _createUpdateResult(record, node, nodesToReturn)
}

// ==== UPDATE

export const updateNode = async ({ user, survey, record, node, system = false, updateDependents = true }, t) => {
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

  if (NodeDef.isFile(nodeDef)) {
    // mark old file as deleted if changed
    const nodePrev = await NodeRepository.fetchNodeByUuid(surveyId, Node.getUuid(node), t)
    const fileUuidPrev = Node.getFileUuid(nodePrev)
    if (fileUuidPrev !== null && fileUuidPrev !== Node.getFileUuid(node)) {
      await FileRepository.markFileAsDeleted(surveyId, fileUuidPrev, t)
    }
  }

  const nodeUpdated = await NodeRepository.updateNode(
    {
      surveyId,
      nodeUuid: Node.getUuid(node),
      value: Node.getValue(node),
      meta,
      draft: Record.isPreview(record),
      reloadNode: updateDependents,
    },
    t
  )

  if (updateDependents && nodeUpdated) {
    const recordUpdated = Record.assocNode(nodeUpdated)(record)
    return _onNodeUpdate(survey, recordUpdated, nodeUpdated, {}, t)
  } else {
    return _createUpdateResult(record, node)
  }
}

export const persistNode = async (
  { user, survey, record, node, system = false, createMultipleEntities = true },
  client
) => {
  const nodeUuid = Node.getUuid(node)

  const existingNode = Record.getNodeByUuid(nodeUuid)(record)

  if (existingNode) {
    // Updating existing node
    return updateNode({ user, survey, record, node, system }, client)
  }
  // Inserting new node
  return insertNode({ user, survey, record, node, system, createMultipleEntities }, client)
}

const _reloadNodes = async ({ surveyId, record, nodes }, tx) => {
  const nodesReloadedArray = (
    await NodeRepository.fetchNodesWithRefDataByUuids(
      { surveyId, nodeUuids: Object.keys(nodes), draft: Record.isPreview(record) },
      tx
    )
  ).map((nodeReloaded) => {
    // preserve status flags (used in rdb updates)
    const oldNode = nodes[Node.getUuid(nodeReloaded)]
    return R.pipe(
      Node.assocCreated(Node.isCreated(oldNode)),
      Node.assocDeleted(Node.isDeleted(oldNode)),
      Node.assocUpdated(Node.isUpdated(oldNode))
    )(nodeReloaded)
  })
  return ObjectUtils.toUuidIndexedObj(nodesReloadedArray)
}

export const updateNodesDependents = async (survey, record, nodes, tx) => {
  const { record: recordUpdatedDependents, nodes: nodesUpdated } = Record.updateNodesDependents({
    survey,
    record,
    nodes,
    logger,
  })

  let recordUpdated = recordUpdatedDependents

  // persist updates in batch
  if (!R.isEmpty(nodesUpdated)) {
    const nodesArray = Object.values(nodesUpdated)
    const surveyId = Survey.getId(survey)
    await NodeRepository.updateNodes({ surveyId, nodes: nodesArray }, tx)

    // reload nodes to get nodes ref data
    const nodesReloaded = await _reloadNodes({ surveyId, record: recordUpdated, nodes: nodesUpdated }, tx)
    Object.assign(nodesUpdated, nodesReloaded)
    recordUpdated = Record.mergeNodes(nodesReloaded)(recordUpdated)
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

  let nodeDependentUniqueAttributes = Record.getAttributesUniqueDependent({ survey, record, node })

  const recordUpdated = Record.assocNode(node)(record)

  // mark deleted dependent attributes
  nodeDependentUniqueAttributes = Object.values(nodeDependentUniqueAttributes).reduce((nodesAcc, nodeDependent) => {
    const nodeDependentUuid = Node.getUuid(nodeDependent)
    const deleted = !Record.getNodeByUuid(nodeDependentUuid)(recordUpdated)
    const nodeDependentUpdated = Node.assocDeleted(deleted)(nodeDependent)
    return { ...nodesAcc, [nodeDependentUuid]: nodeDependentUpdated }
  }, {})

  return _onNodeUpdate(
    survey,
    recordUpdated,
    node,
    { ...nodeDependentKeyAttributes, ...nodeDependentUniqueAttributes },
    t
  )
}

export const deleteNodesByNodeDefUuids = async (user, surveyId, nodeDefUuids, record, client = db) =>
  client.tx(async (t) => {
    const nodesDeleted = await NodeRepository.deleteNodesByNodeDefUuids(surveyId, nodeDefUuids, t)
    const activities = nodesDeleted.map((node) =>
      ActivityLog.newActivity(ActivityLog.type.nodeDelete, { uuid: Node.getUuid(node) }, true)
    )
    await ActivityLogRepository.insertMany(user, surveyId, activities, t)
    return Record.mergeNodes(ObjectUtils.toUuidIndexedObj(nodesDeleted))(record)
  })
