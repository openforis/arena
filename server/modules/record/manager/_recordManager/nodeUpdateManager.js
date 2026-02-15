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
import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'
import { TaxonProviderDefault } from '@server/modules/taxonomy/manager/taxonProviderDefault'
import * as NodeRepository from '../../repository/nodeRepository'
import * as FileRepository from '../../repository/fileRepository'

const logger = Log.getLogger('NodeUpdateManager')

const categoryItemProvider = CategoryItemProviderDefault
const taxonProvider = TaxonProviderDefault

const _createUpdateResult = (record, node = null, nodes = {}) => {
  if (!node && R.isEmpty(nodes)) {
    return { record, nodes: {} }
  }
  let recordUpdated = R.isEmpty(nodes) ? record : Record.mergeNodes(nodes)(record)

  const parentNode = Record.getParentNode(node)(recordUpdated)

  recordUpdated = Record.assocDateModified(new Date())(recordUpdated)
  return {
    record: recordUpdated,
    nodes: {
      [Node.getIId(node)]: node,
      // Always assoc parentNode, used in surveyRdbManager.updateTableNodes
      ...(parentNode ? { [Node.getIId(parentNode)]: parentNode } : {}),
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
            ? NodeRepository.deleteNode(surveyId, Node.getIId(nodeDependent), t)
            : NodeRepository.updateNode(
                {
                  surveyId,
                  nodeIId: Node.getIId(nodeDependent),
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

  const value = Node.getValue(node)
  if (NodeDef.isFile(nodeDef)) {
    // mark old file as deleted if changed
    const nodePrev = await NodeRepository.fetchNodeByIId(surveyId, Node.getRecordUuid(node), Node.getIId(node), t)
    const fileUuidPrev = Node.getFileUuid(nodePrev)
    if (fileUuidPrev !== null && fileUuidPrev !== Node.getFileUuid(node)) {
      await FileRepository.markFileAsDeleted(surveyId, fileUuidPrev, t)
    }
  }

  const nodeUpdated = await NodeRepository.updateNode(
    {
      surveyId,
      recordUuid: Node.getRecordUuid(node),
      nodeIId: Node.getIId(node),
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
  const recordUuid = Record.getUuid(record)
  const nodesReloadedArray = (
    await NodeRepository.fetchNodesWithRefDataByUuids(
      { surveyId, recordUuid, nodeUuids: Object.keys(nodes), draft: Record.isPreview(record) },
      tx
    )
  ).map((nodeReloaded) => {
    // preserve status flags (used in rdb updates)
    const oldNode = nodes[Node.getIId(nodeReloaded)]
    return R.pipe(
      Node.assocCreated(Node.isCreated(oldNode)),
      Node.assocDeleted(Node.isDeleted(oldNode)),
      Node.assocUpdated(Node.isUpdated(oldNode))
    )(nodeReloaded)
  })
  return ObjectUtils.toUuidIndexedObj(nodesReloadedArray)
}

const _groupNodesByFlags = (nodesArray) =>
  nodesArray.reduce(
    (acc, node) => {
      if (Node.isCreated(node) && !Node.getId(node)) {
        acc.nodesInserted.push(node)
      } else if (Node.isDeleted(node)) {
        acc.nodesDeleted.push(node)
      } else {
        acc.nodesUpdated.push(node)
      }
      return acc
    },
    { nodesInserted: [], nodesUpdated: [], nodesDeleted: [] }
  )

const _persistNodes = async ({ surveyId, nodesArray }, tx) => {
  const { nodesInserted, nodesUpdated, nodesDeleted } = _groupNodesByFlags(nodesArray)

  if (nodesInserted.length) {
    await NodeRepository.insertNodesInBatch({ surveyId, nodes: nodesInserted }, tx)
  }
  if (nodesUpdated.length) {
    await NodeRepository.updateNodes({ surveyId, nodes: nodesUpdated }, tx)
  }
  if (nodesDeleted.length) {
    await NodeRepository.deleteNodesByInternalIds(surveyId, nodesDeleted.map(Node.getIId), tx)
  }
}

export const updateNodesDependents = async (
  { user, survey, record, nodes, timezoneOffset, persistNodes = true, sideEffect = false },
  tx
) => {
  const { record: recordUpdatedDependents, nodes: allNodesUpdated } = await Record.updateNodesDependents({
    user,
    survey,
    record,
    nodes,
    categoryItemProvider,
    taxonProvider,
    timezoneOffset,
    logger,
    sideEffect,
  })

  let recordUpdated = recordUpdatedDependents

  // persist updates in batch
  if (persistNodes && !R.isEmpty(allNodesUpdated)) {
    const nodesArray = Object.values(allNodesUpdated)
    const surveyId = Survey.getId(survey)

    await _persistNodes({ surveyId, nodesArray }, tx)

    // reload nodes to get nodes ref data
    const nodesReloaded = await _reloadNodes({ surveyId, record: recordUpdated, nodes: allNodesUpdated }, tx)

    Object.assign(allNodesUpdated, nodesReloaded)
    recordUpdated = Record.mergeNodes(nodesReloaded)(recordUpdated)
  }

  return {
    record: recordUpdated,
    nodes: allNodesUpdated,
  }
}

// ==== DELETE

const _getNodeDependentKeyAttributes = (survey, record, node) => {
  const nodeDependentKeyAttributesByIId = {}
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
            nodeDependentKeyAttributesByIId[Node.getIId(nodeKey)] = nodeKey
          })
        }
      })
    }
  }

  return nodeDependentKeyAttributesByIId
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
    const nodeDependentIId = Node.getIId(nodeDependent)
    const deleted = !Record.getNodeByInternalId(nodeDependentIId)(recordUpdated)
    const nodeDependentUpdated =
      Node.isDeleted(nodeDependent) !== deleted ? Node.assocDeleted(deleted)(nodeDependent) : nodeDependent
    return { ...nodesAcc, [nodeDependentIId]: nodeDependentUpdated }
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
      ActivityLog.newActivity(ActivityLog.type.nodeDelete, { iId: Node.getIId(node) }, true)
    )
    await ActivityLogRepository.insertMany(user, surveyId, activities, t)
    const nodesDeletedByIId = ObjectUtils.toIIdIndexedObj(nodesDeleted)
    const recordUpdated = Record.mergeNodes(nodesDeletedByIId, { sideEffect: true })(record)
    return { record: recordUpdated, nodesDeleted }
  })

export const deleteNodesByInternalIds = async ({ user, surveyId, nodeInternalIds, systemActivity = false }, tx) => {
  const nodesDeleted = await NodeRepository.deleteNodesByInternalIds(surveyId, nodeInternalIds, tx)
  const activities = nodeInternalIds.map((iId) =>
    ActivityLog.newActivity(ActivityLog.type.nodeDelete, { iId }, systemActivity)
  )
  await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
  return nodesDeleted
}
