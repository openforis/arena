import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as ObjectUtils from '@core/objectUtils'

import { db } from '@server/db/db'
import * as Log from '@server/log/log'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as NodeRepository from '../../repository/nodeRepository'
import * as FileRepository from '../../repository/fileRepository'

const logger = Log.getLogger('NodeUpdateManager')

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

  let value = Node.getValue(node)
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
      value,
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

export const updateNodesDependents = async (
  { survey, record, nodes, timezoneOffset, persistNodes = true, sideEffect = false },
  tx
) => {
  const { record: recordUpdatedDependents, nodes: nodesUpdated } = Record.updateNodesDependents({
    survey,
    record,
    nodes,
    timezoneOffset,
    logger,
    sideEffect,
  })

  let recordUpdated = recordUpdatedDependents

  // persist updates in batch
  if (persistNodes && !R.isEmpty(nodesUpdated)) {
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
    const nodeDependentUpdated =
      Node.isDeleted(nodeDependent) !== deleted ? Node.assocDeleted(deleted)(nodeDependent) : nodeDependent
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

export const deleteNodesByUuids = async ({ user, surveyId, nodeUuids, systemActivity = false }, tx) => {
  const nodesDeleted = await NodeRepository.deleteNodesByUuids(surveyId, nodeUuids, tx)
  const activities = nodeUuids.map((uuid) =>
    ActivityLog.newActivity(ActivityLog.type.nodeDelete, { uuid }, systemActivity)
  )
  await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
  return nodesDeleted
}
