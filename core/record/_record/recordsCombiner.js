import { Dates, Objects, Records, RecordUpdateResult, Surveys } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as ObjectUtils from '@core/objectUtils'

import { NodeValues } from '../nodeValues'
import * as RecordReader from './recordReader'

import { updateAttributeValue } from './recordNodeValueUpdater'
import { afterNodesUpdate } from './recordNodesUpdaterCommon'

// Deliberately does not short-circuit on internal id equality: unlike the uuid this replaced
// (globally unique, so a match could only ever mean "the same node"), internal ids are a plain
// per-record counter starting at 1 - two independently-built records (the only case mergeRecords
// is ever called with: merging a duplicate submission, or a mobile import, into an existing
// record) routinely reuse the same small internal ids for entirely unrelated nodes. Matching on
// that would produce false positives, silently treating an unrelated source node as "already
// present" and discarding it instead of adding it. Key values are the only signal that's actually
// comparable across two independently-numbered records.
const findEntityByKeys = ({ survey, record, entityDefUuid, parentEntity, keyValuesByDefUuid = null }) =>
  keyValuesByDefUuid
    ? Records.findEntityByKeyValues({ survey, record, parentEntity, entityDefUuid, keyValuesByDefUuid })
    : null

const _getDateCreatedTime = (node) => new Date(Node.getDateCreated(node)).getTime()

// Sorts by dateCreated, falling back to original array order for ties. Used as the last-resort way
// to pair up same-def siblings that have no content-based identity to match on (see
// _pairChildrenOfSameDef): dateCreated survives independent renumbering unlike iId, but nodes
// created together in the same batch (e.g. an entity's auto-populated default children, or a bulk
// import) routinely share the same millisecond, so ties still need a stable secondary order.
const _sortByCreationOrder = (nodes) =>
  nodes
    .map((node, index) => ({ node, index }))
    .sort((a, b) => {
      const dateDiff = _getDateCreatedTime(a.node) - _getDateCreatedTime(b.node)
      return dateDiff !== 0 ? dateDiff : a.index - b.index
    })
    .map(({ node }) => node)

const _getEntityKeyValues = ({ survey, cycle, record, entity }) =>
  Records.getEntityKeyValuesByDefUuid({ survey, cycle, record, entity })

// Pairs up children of the same def from two independently-numbered records (source and target),
// without relying on internal id equality - see the header comment on findEntityByKeys: two
// independently-built records routinely reuse the same small internal ids for entirely unrelated
// nodes, which replaceUpdatedNodes used to match on, silently deleting-and-recreating nodes that
// were actually unchanged (and orphaning anything keyed off their old internal id - files, RDB
// rows, validation fields) whenever the source's and target's ids happened to diverge.
//
// Multiple entities that declare key attributes are matched by key value equality, the same way
// mergeRecords matches them. Everything else - multiple attributes, and multiple entities with no
// key attributes - has no content-based identity to match on, so pairs are formed by creation order
// instead (see _sortByCreationOrder).
//
// Returns { pairs, sourceOnly, targetOnly }: pairs are [source, target] node tuples to update in
// place, sourceOnly are unmatched source nodes to add, targetOnly are unmatched target nodes to
// delete.
const _pairChildrenOfSameDef = ({
  survey,
  cycle,
  recordSource,
  recordTarget,
  childDef,
  childrenSource,
  childrenTarget,
}) => {
  const pairs = []
  const hasKeys = NodeDef.isEntity(childDef) && Surveys.getNodeDefKeys({ survey, cycle, nodeDef: childDef }).length > 0

  if (!hasKeys) {
    // no content-based identity to match on (a plain multiple attribute, or a multiple entity with
    // no key attributes). First, match siblings that share the exact same dateCreated: under the
    // same parent and node def, that's the same signal mergeRecords' key-value match relies on for
    // keyed entities - two independently-built records can't agree on a timestamp by accident. It's
    // also strictly better than the creation-order fallback below when the two sides' child counts
    // differ (e.g. one side has an extra or a missing node), since a positional pairing shifts every
    // later pair out of alignment while a dateCreated match doesn't.
    let unmatchedTarget = [...childrenTarget]
    const unmatchedSource = []
    for (const nodeSource of childrenSource) {
      const dateCreatedSource = _getDateCreatedTime(nodeSource)
      const matchIndex = unmatchedTarget.findIndex(
        (nodeTargetCandidate) => _getDateCreatedTime(nodeTargetCandidate) === dateCreatedSource
      )
      if (matchIndex >= 0) {
        pairs.push([nodeSource, unmatchedTarget[matchIndex]])
        unmatchedTarget = unmatchedTarget.filter((_node, index) => index !== matchIndex)
      } else {
        unmatchedSource.push(nodeSource)
      }
    }

    // anything left shares no dateCreated with a sibling on the other side - pair it by creation
    // order, the last resort when there's no content-based identity left to match on
    const sortedSource = _sortByCreationOrder(unmatchedSource)
    const sortedTarget = _sortByCreationOrder(unmatchedTarget)
    const pairCount = Math.min(sortedSource.length, sortedTarget.length)
    for (let i = 0; i < pairCount; i += 1) {
      pairs.push([sortedSource[i], sortedTarget[i]])
    }
    return { pairs, sourceOnly: sortedSource.slice(pairCount), targetOnly: sortedTarget.slice(pairCount) }
  }

  // keyed multiple entity: match by key value equality. Anything left over here is definitively
  // unmatched (there's no fallback to creation order once a key comparison has already ruled a pair
  // out), so it goes straight to sourceOnly/targetOnly rather than through a second matching pass.
  let unmatchedTarget = childrenTarget
  const sourceOnly = []
  for (const entitySource of childrenSource) {
    const keyValuesSource = _getEntityKeyValues({ survey, cycle, record: recordSource, entity: entitySource })
    const matchIndex = unmatchedTarget.findIndex((entityTargetCandidate) =>
      Objects.isEqual(
        keyValuesSource,
        _getEntityKeyValues({ survey, cycle, record: recordTarget, entity: entityTargetCandidate })
      )
    )
    if (matchIndex >= 0) {
      pairs.push([entitySource, unmatchedTarget[matchIndex]])
      unmatchedTarget = unmatchedTarget.filter((_node, index) => index !== matchIndex)
    } else {
      sourceOnly.push(entitySource)
    }
  }

  return { pairs, sourceOnly, targetOnly: unmatchedTarget }
}

const _replaceAttributeValueIfEmptyOrModified = ({
  survey,
  attrDef,
  recordTarget,
  entityTarget,
  attrSource,
  attrTarget,
  sideEffect,
}) => {
  const sourceDateModified = Node.getDateModified(attrSource)
  const targetDateModified = Node.getDateModified(attrTarget)
  const valueSource = Node.getValue(attrSource)
  const valueTarget = Node.getValue(attrTarget)
  if (Objects.isEmpty(valueTarget) || Dates.isAfter(sourceDateModified, targetDateModified)) {
    const attributeUpdateResult = updateAttributeValue({
      survey,
      record: recordTarget,
      entity: entityTarget,
      attributeDef: attrDef,
      attribute: attrTarget,
      value: valueSource,
      dateModified: sourceDateModified,
      sideEffect,
    })
    return attributeUpdateResult
  }
  return null
}

const _replaceUpdatedNodesInEntities = ({
  survey,
  recordSource,
  recordTarget,
  entitySource,
  entityTarget,
  sideEffect = false,
}) => {
  const includeAnalysis = false
  const updateResult = new RecordUpdateResult({ record: recordTarget })

  const entityDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(entitySource))(survey)

  const metaSource = Node.getMeta(entitySource)
  const metaTarget = Node.getMeta(entityTarget)
  if (!Objects.isEqual(metaSource, metaTarget)) {
    const entityTargetUpdated = A.pipe(Node.assocMeta(metaSource), Node.assocUpdated(true))(entityTarget)
    updateResult.addNode(entityTargetUpdated, { sideEffect })
  }

  const childDefs = Survey.getNodeDefChildren({ nodeDef: entityDef, includeAnalysis })(survey)
  for (const childDef of childDefs) {
    const childDefUuid = NodeDef.getUuid(childDef)

    const childrenSource = RecordReader.getNodeChildrenByDefUuidUnsorted(entitySource, childDefUuid)(recordSource)
    const childrenTarget = RecordReader.getNodeChildrenByDefUuidUnsorted(
      entityTarget,
      childDefUuid
    )(updateResult.record)

    const { pairs, sourceOnly, targetOnly } = _pairChildrenOfSameDef({
      survey,
      cycle: recordTarget.cycle,
      recordSource,
      recordTarget: updateResult.record,
      childDef,
      childrenSource,
      childrenTarget,
    })

    // delete target nodes with no match in source
    if (targetOnly.length > 0) {
      const targetOnlyIIds = targetOnly.map(Node.getIId)
      const nodesDeleteUpdateResult = Records.deleteNodes(targetOnlyIIds, { sideEffect })(updateResult.record)
      updateResult.merge(nodesDeleteUpdateResult)
    }

    // add source nodes with no match in target; _cloneEntityAndDescendants assigns them fresh ids
    // from the target record's own counter, rather than keeping the source's, since source and
    // target are independently numbered (see _pairChildrenOfSameDef) and reusing the source's ids
    // here could collide with an unrelated node the target already has under it
    for (const childSourceToAdd of sourceOnly) {
      _cloneEntityAndDescendants({
        updateResult,
        recordSource,
        entitySource: childSourceToAdd,
        parentEntity: entityTarget,
        sideEffect,
      })
    }

    // update matched pairs (nodes present, under this def, in both source and target records)
    for (const [childSource, childTargetToUpdate] of pairs) {
      if (NodeDef.isAttribute(childDef)) {
        const attrUpdateResult = _replaceAttributeValueIfEmptyOrModified({
          survey,
          attrDef: childDef,
          recordTarget: updateResult.record,
          entityTarget,
          attrSource: childSource,
          attrTarget: childTargetToUpdate,
          sideEffect,
        })
        if (attrUpdateResult) {
          updateResult.merge(attrUpdateResult)
        }
      } else {
        const childEntityUpdateResult = _replaceUpdatedNodesInEntities({
          survey,
          recordSource,
          recordTarget: updateResult.record,
          entitySource: childSource,
          entityTarget: childTargetToUpdate,
          sideEffect,
        })
        updateResult.merge(childEntityUpdateResult)
      }
    }
  }
  return updateResult
}

export const replaceUpdatedNodes =
  ({ user, survey, recordSource, categoryItemProvider, taxonProvider, timezoneOffset, sideEffect = false }) =>
  async (recordTarget) => {
    const rootSource = RecordReader.getRootNode(recordSource)
    const rootTarget = RecordReader.getRootNode(recordTarget)
    if (Node.getIId(rootTarget) !== Node.getIId(rootSource)) {
      // it should never happen...
      throw new Error('error merging records: root entities have different iIds')
    }
    const updateResult = _replaceUpdatedNodesInEntities({
      survey,
      recordSource,
      recordTarget,
      entitySource: rootSource,
      entityTarget: rootTarget,
      sideEffect,
    })
    return afterNodesUpdate({
      user,
      survey,
      record: updateResult.record,
      nodes: updateResult.nodes,
      categoryItemProvider,
      taxonProvider,
      timezoneOffset,
      sideEffect,
    })
  }

const _recalculateNodeHierarchy = ({ parentEntity, node }) => {
  const parentEntityIId = Node.getIId(parentEntity)
  node[Node.keys.pIId] = parentEntityIId
  const hierarchyUpdated = [...Node.getHierarchy(parentEntity), parentEntityIId]
  Objects.setInPath({ obj: node, path: [Node.keys.meta, Node.metaKeys.hierarchy], value: hierarchyUpdated })
}

const _addNodeToUpdateResult = ({
  updateResult,
  node,
  parentEntity: parentEntityParam = undefined,
  assignNewIds = false,
  sideEffect = false,
}) => {
  const { record } = updateResult
  const newNodeToAdd = sideEffect ? Node.setCreated(node) : Node.assocCreated(true)(node)
  if (assignNewIds) {
    const lastNodeInternalId = RecordReader.getLastNodeInternalId(record)
    const newInternalId = lastNodeInternalId + 1
    newNodeToAdd[Node.keys.iId] = newInternalId
    const recordUpdated = { ...record, lastNodeInternalId: newInternalId }
    updateResult.merge(new RecordUpdateResult({ record: recordUpdated }))
  }
  // clear id, used for storage in DB, but not needed for the updateResult
  delete newNodeToAdd[Node.keys.id]

  newNodeToAdd[Node.keys.recordUuid] = record.uuid

  const parentEntity = parentEntityParam ?? RecordReader.getNodeByInternalId(Node.getParentInternalId(node))(record)
  _recalculateNodeHierarchy({ node: newNodeToAdd, parentEntity })
  updateResult.addNode(newNodeToAdd, { sideEffect })
}

const _mergeSingleAttributeValues = ({
  survey,
  record,
  childDef,
  entityTarget,
  childSource,
  childTarget,
  sideEffect,
}) => {
  const valueSource = Node.getValue(childSource)
  const valueTarget = Node.getValue(childTarget)
  if (
    Node.isValueBlank(childSource) ||
    NodeValues.isValueEqual({
      survey,
      nodeDef: childDef,
      value: valueSource,
      valueSearch: valueTarget,
      record,
      parentNode: entityTarget,
    })
  ) {
    return null
  }
  return _replaceAttributeValueIfEmptyOrModified({
    survey,
    attrDef: childDef,
    recordTarget: record,
    entityTarget,
    attrSource: childSource,
    attrTarget: childTarget,
    sideEffect,
  })
}

const _areNotSameValues = ({ survey, childDef, updateResult, entityTarget, sourceValues, targetValues }) =>
  sourceValues.length !== targetValues.length ||
  sourceValues.some((sourceValue, index) => {
    const targetValue = targetValues[index]
    return !NodeValues.isValueEqual({
      survey,
      nodeDef: childDef,
      value: sourceValue,
      valueSearch: targetValue,
      record: updateResult.record,
      parentNode: entityTarget,
    })
  })

const replaceNodes = ({ childrenSource, childrenTarget, entityTarget, sideEffect, updateResult }) => {
  const childrenTargetToDeleteIIds = childrenTarget.map(Node.getIId)
  const nodesDeleteUpdateResult = Records.deleteNodes(childrenTargetToDeleteIIds, { sideEffect })(updateResult.record)
  updateResult.merge(nodesDeleteUpdateResult)
  for (const childSource of childrenSource) {
    _addNodeToUpdateResult({ updateResult, node: childSource, parentEntity: entityTarget })
  }
}

const _mergeMultipleAttributes = ({
  updateResult,
  survey,
  childDef,
  childrenSource,
  childrenTarget,
  entityTarget,
  sideEffect,
}) => {
  if (childrenSource.length > 0) {
    const sourceValues = childrenSource.map(Node.getValue)
    const targetValues = childrenTarget.map(Node.getValue)

    if (NodeDef.isCode(childDef)) {
      // replace nodes if values are different
      if (_areNotSameValues({ survey, childDef, updateResult, entityTarget, sourceValues, targetValues })) {
        // different values, replace all nodes
        replaceNodes({ childrenSource, childrenTarget, entityTarget, updateResult, sideEffect })
      }
    } else {
      // keep nodes from both records, unless they have the same value
      for (const childSource of childrenSource) {
        const sourceValue = Node.getValue(childSource)
        if (
          !targetValues.find((targetValue) =>
            NodeValues.isValueEqual({
              survey,
              nodeDef: childDef,
              value: sourceValue,
              valueSearch: targetValue,
              record: updateResult.record,
              parentNode: entityTarget,
            })
          )
        ) {
          // value not in target values => add it to the record
          _addNodeToUpdateResult({ updateResult, node: childSource, parentEntity: entityTarget, assignNewIds: true })
        }
      }
    }
  }
}

const _cloneEntityAndDescendants = async ({
  updateResult,
  recordSource,
  entitySource,
  parentEntity,
  sideEffect = false,
}) => {
  const newNodeIIdByOldIId = {}
  // New ids must come from the target record's own counter, not the source's: source and target
  // are two independently-built records (a duplicate submission, or a mobile import, merged into
  // an existing record), each with their own internal id sequence starting near 1. Drawing new
  // ids from the source's counter would routinely collide with ids the target record already
  // uses, silently overwriting unrelated existing nodes instead of adding the cloned ones.
  let lastNodeInternalId = RecordReader.getLastNodeInternalId(updateResult.record)
  RecordReader.visitDescendantsAndSelf(entitySource, (visitedChildSource) => {
    const oldIId = Node.getIId(visitedChildSource)
    const oldParentIId = Node.getParentInternalId(visitedChildSource)
    const newIId = ++lastNodeInternalId
    newNodeIIdByOldIId[oldIId] = newIId
    const newParentEntityIId =
      visitedChildSource === entitySource
        ? Node.getIId(parentEntity)
        : (newNodeIIdByOldIId[oldParentIId] ?? oldParentIId) // if parent node is not in the visited path, keep the same parentIId (it will be updated in hierarchy recalculation)
    const nodeTarget = ObjectUtils.clone(visitedChildSource)
    Node.removeFlags({ sideEffect: true })(nodeTarget)
    nodeTarget[Node.keys.created] = true // consider it as new node, to allow RDB updates
    nodeTarget[Node.keys.iId] = newIId
    nodeTarget[Node.keys.pIId] = newParentEntityIId
    // node hierarchy will be recalculated in _addNodeToUpdateResult
    _addNodeToUpdateResult({ updateResult, node: nodeTarget, sideEffect })
  })(recordSource)
  // Persist the advanced counter onto the target record: _addNodeToUpdateResult was called above
  // without assignNewIds (ids were already assigned here), so it never updated it, and later
  // additions in this same merge (e.g. _mergeMultipleAttributes's assignNewIds: true path) must
  // not reuse ids handed out in this loop.
  updateResult.merge(new RecordUpdateResult({ record: { ...updateResult.record, lastNodeInternalId } }))
}

const _mergeMultipleEntities = ({
  updateResult,
  survey,
  recordSource,
  childDefUuid,
  childrenSource,
  entityTarget,
  stack,
  sideEffect = false,
}) => {
  for (const childSource of childrenSource) {
    const keyValuesByDefUuid = Records.getEntityKeyValuesByDefUuid({
      survey,
      cycle: recordSource.cycle,
      record: recordSource,
      entity: childSource,
    })
    const childTarget = findEntityByKeys({
      survey,
      record: updateResult.record,
      entityDefUuid: childDefUuid,
      parentEntity: entityTarget,
      keyValuesByDefUuid,
    })
    if (childTarget) {
      // entity found: nested nodes will be merged
      stack.push({ entitySource: childSource, entityTarget: childTarget })
    } else {
      // add new entity
      _cloneEntityAndDescendants({
        updateResult,
        recordSource,
        entitySource: childSource,
        parentEntity: entityTarget,
        sideEffect,
      })
    }
  }
}

const _mergeRecordsNodes = ({
  updateResult,
  survey,
  childDef,
  recordSource,
  entitySource,
  entityTarget,
  stack,
  sideEffect,
}) => {
  const childDefUuid = NodeDef.getUuid(childDef)
  const childrenSource = RecordReader.findNodeChildren(entitySource, childDefUuid)(recordSource)
  const childrenTarget = RecordReader.findNodeChildren(entityTarget, childDefUuid)(updateResult.record)
  if (NodeDef.isSingle(childDef)) {
    const childSource = childrenSource[0]
    const childTarget = childrenTarget[0]
    if (childSource && childTarget) {
      if (NodeDef.isAttribute(childDef)) {
        // single attribute
        const attrUpdateResult = _mergeSingleAttributeValues({
          survey,
          record: updateResult.record,
          entityTarget,
          childDef,
          childSource,
          childTarget,
          sideEffect,
        })
        if (attrUpdateResult) {
          updateResult.merge(attrUpdateResult)
        }
      } else {
        // single entity
        stack.push({ entitySource: childSource, entityTarget: childTarget })
      }
    }
  } else if (NodeDef.isEntity(childDef)) {
    // multiple entity
    _mergeMultipleEntities({
      updateResult,
      survey,
      recordSource,
      childrenSource,
      childDefUuid,
      entityTarget,
      stack,
      sideEffect,
    })
  } else {
    // multiple attributes merge
    _mergeMultipleAttributes({
      updateResult,
      survey,
      childDef,
      entityTarget,
      childrenSource,
      childrenTarget,
      sideEffect,
    })
  }
}

export const mergeRecords =
  ({ user, survey, recordSource, categoryItemProvider, taxonProvider, timezoneOffset, sideEffect = false }) =>
  async (recordTarget) => {
    const { cycle } = recordTarget
    const rootSource = RecordReader.getRootNode(recordSource)
    const rootTarget = RecordReader.getRootNode(recordTarget)

    const updateResult = new RecordUpdateResult({ record: recordTarget })

    const stack = [{ entitySource: rootSource, entityTarget: rootTarget }]
    while (stack.length > 0) {
      const { entitySource, entityTarget } = stack.pop()

      const entityDef = Surveys.getNodeDefByUuid({ survey, uuid: Node.getNodeDefUuid(entitySource) })
      const childDefs = Surveys.getNodeDefChildrenSorted({ survey, nodeDef: entityDef, cycle })
      for (const childDef of childDefs) {
        _mergeRecordsNodes({
          updateResult,
          survey,
          childDef,
          recordSource,
          entitySource,
          entityTarget,
          stack,
          sideEffect,
        })
      }
    }
    return afterNodesUpdate({
      user,
      survey,
      record: updateResult.record,
      nodes: updateResult.nodes,
      categoryItemProvider,
      taxonProvider,
      timezoneOffset,
      sideEffect,
    })
  }
