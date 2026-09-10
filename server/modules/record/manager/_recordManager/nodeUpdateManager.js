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
import * as RecordFileManager from '../recordFileManager'

const logger = Log.getLogger('NodeUpdateManager')

const categoryItemProvider = CategoryItemProviderDefault
const taxonProvider = TaxonProviderDefault

const _isFileValueNode = (survey, node) => {
  if (!Node.getFileUuid(node)) return false
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  return NodeDef.isFile(nodeDef)
}

const _toFileDeleteParams = (node) => ({ fileUuid: Node.getFileUuid(node), recordUuid: Node.getRecordUuid(node) })

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

  const value = Node.getValue(node)
  if (NodeDef.isFile(nodeDef)) {
    // mark/delete old file if changed
    const nodePrev = await NodeRepository.fetchNodeByUuid(surveyId, Node.getUuid(node), t)
    const fileUuidPrev = Node.getFileUuid(nodePrev)
    if (fileUuidPrev !== null && fileUuidPrev !== Node.getFileUuid(node)) {
      if (Record.isPreview(record)) {
        // preview records: hard-delete now, nothing ever purges soft-deleted preview files
        await RecordFileManager.deleteFileByUuid(
          { surveyId, fileUuid: fileUuidPrev, recordUuid: Node.getRecordUuid(nodePrev) },
          t
        )
      } else {
        // non-preview records: soft-delete (unchanged, out of scope for this fix)
        await FileRepository.markFileAsDeleted(surveyId, fileUuidPrev, t)
      }
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

const _persistNodes = async ({ survey, nodesArray, isPreview = false }, tx) => {
  const surveyId = Survey.getId(survey)
  const { nodesInserted, nodesUpdated, nodesDeleted } = _groupNodesByFlags(nodesArray)

  if (nodesInserted.length) {
    await NodeRepository.insertNodesInBatch({ surveyId, nodes: nodesInserted }, tx)
  }
  if (nodesUpdated.length) {
    await NodeRepository.updateNodes({ surveyId, nodes: nodesUpdated }, tx)
  }
  if (nodesDeleted.length) {
    if (isPreview) {
      // dependency/applicability-driven deletion: nodesDeleted already includes every individual
      // descendant node explicitly (Record.updateNodesDependents flattens the whole subtree), so
      // no separate subtree lookup is needed - just filter the nodes we already have in memory.
      const files = nodesDeleted.filter((node) => _isFileValueNode(survey, node)).map(_toFileDeleteParams)
      if (files.length > 0) {
        await RecordFileManager.deleteFiles({ surveyId, files }, tx)
      }
    }
    await NodeRepository.deleteNodesByUuids(surveyId, nodesDeleted.map(Node.getUuid), tx)
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

    await _persistNodes({ survey, nodesArray, isPreview: Record.isPreview(record) }, tx)

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

  if (Record.isPreview(record)) {
    // record is still fully loaded at this point (nothing has removed descendants from it yet),
    // so the subtree can be found in memory instead of querying the DB - gather and hard-delete
    // files of any file-type nodes in this subtree BEFORE the cascading DELETE removes descendant
    // node rows silently
    const rootNode = Record.getNodeByUuid(nodeUuid)(record)
    const files = Record.getNodesArray(record)
      .filter((n) => rootNode && (Node.getUuid(n) === nodeUuid || Node.isDescendantOf(rootNode)(n)))
      .filter((n) => _isFileValueNode(survey, n))
      .map(_toFileDeleteParams)
    if (files.length > 0) {
      await RecordFileManager.deleteFiles({ surveyId, files }, t)
    }
  }

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

// This delete is NOT scoped to a single record - it can affect nodes across many records of the
// survey at once (e.g. RecordCheckJob runs it once per cycle, for a node def that no longer
// exists, rather than once per record). On a large survey it can match millions of rows, so unlike
// most node mutations here, it intentionally does not return or log the individual affected nodes:
// pulling them all into memory (or logging one activity per node) is enough on its own to exhaust
// a job worker's heap - see NodeRepository.deleteNodesByNodeDefUuids. Callers that need to reflect
// the deletion in an already-loaded record should do so locally instead, filtering that record's
// own nodes by nodeDefUuids (they're already in memory, so this needs no extra data from here).
export const deleteNodesByNodeDefUuids = async (user, surveyId, nodeDefUuids, client = db) =>
  client.tx(async (t) => {
    // NOTE: do not gate this on Record.isPreview(record) (that would wrongly skip cleanup of other
    // preview records' files). Correctness relies entirely on the SQL-level `record.preview = true`
    // join inside deleteFilesByNodeDefUuids/fetchFileValueNodesByNodeDefUuids.
    await RecordFileManager.deleteFilesByNodeDefUuids({ surveyId, nodeDefUuids }, t)
    const deletedCount = await NodeRepository.deleteNodesByNodeDefUuids(surveyId, nodeDefUuids, t)
    // One activity per node def (matches the bulk-delete convention used by e.g.
    // taxonomyTaxaDelete), not one per deleted node.
    const activities = nodeDefUuids.map((nodeDefUuid) =>
      ActivityLog.newActivity(ActivityLog.type.nodeDefNodesDelete, { uuid: nodeDefUuid }, true)
    )
    await ActivityLogRepository.insertMany(user, surveyId, activities, t)
    return deletedCount
  })

export const deleteNodesByUuids = async ({ user, surveyId, nodeUuids, systemActivity = false }, tx) => {
  const nodesDeleted = await NodeRepository.deleteNodesByUuids(surveyId, nodeUuids, tx)
  const activities = nodeUuids.map((uuid) =>
    ActivityLog.newActivity(ActivityLog.type.nodeDelete, { uuid }, systemActivity)
  )
  await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
  return nodesDeleted
}
