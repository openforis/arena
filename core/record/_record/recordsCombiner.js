import { Dates, Objects, Records, RecordUpdateResult, Surveys, UUIDs } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as ObjectUtils from '@core/objectUtils'

import { NodeValues } from '../nodeValues'
import * as RecordReader from './recordReader'

import { updateAttributeValue } from './recordNodeValueUpdater'
import { afterNodesUpdate } from './recordNodesUpdaterCommon'

const findEntityByUuidOrKeys = ({
  survey,
  record,
  entityDefUuid,
  parentEntity,
  uuid = null,
  keyValuesByDefUuid = null,
}) => {
  const entityWithSameUuid = uuid ? Records.getNodeByUuid(uuid)(record) : null
  if (entityWithSameUuid) {
    return entityWithSameUuid
  }
  return keyValuesByDefUuid
    ? Records.findEntityByKeyValues({ survey, record, parentEntity, entityDefUuid, keyValuesByDefUuid })
    : null
}

const _findNodeWithSameUuid = (nodeSearch, nodesArray) =>
  nodesArray.find((node) => Node.getUuid(node) === Node.getUuid(nodeSearch))

const _getNodesArrayDifference = (nodes, otherNodes) => nodes.filter((node) => !_findNodeWithSameUuid(node, otherNodes))

const _getNodesArrayIntersection = (nodes, otherNodes) =>
  nodes.filter((node) => !!_findNodeWithSameUuid(node, otherNodes))

const _replaceAttributeValueIfModifiedAfter = ({
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
  if (Dates.isAfter(sourceDateModified, targetDateModified)) {
    const attributeUpdateResult = updateAttributeValue({
      survey,
      record: recordTarget,
      entity: entityTarget,
      attributeDef: attrDef,
      attribute: attrTarget,
      value: Node.getValue(attrSource),
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

  Survey.getNodeDefChildren(
    entityDef,
    includeAnalysis
  )(survey).forEach((childDef) => {
    const childDefUuid = NodeDef.getUuid(childDef)

    const childrenSource = RecordReader.getNodeChildrenByDefUuidUnsorted(entitySource, childDefUuid)(recordSource)
    const childrenTarget = RecordReader.getNodeChildrenByDefUuidUnsorted(
      entityTarget,
      childDefUuid
    )(updateResult.record)

    // delete nodes that are not in source record
    const childrenTargetToDelete = _getNodesArrayDifference(childrenTarget, childrenSource).map(Node.assocDeleted(true))
    if (childrenTargetToDelete.length > 0) {
      const childrenTargetToDeleteUuids = childrenTargetToDelete.map(Node.getUuid)
      const nodesDeleteUpdateResult = Records.deleteNodes(childrenTargetToDeleteUuids, { sideEffect })(
        updateResult.record
      )
      updateResult.merge(nodesDeleteUpdateResult)
    }

    // add new nodes (in source record but not in target record) to updateResult (and record)
    _getNodesArrayDifference(childrenSource, childrenTarget).forEach((childSourceToAdd) => {
      RecordReader.visitDescendantsAndSelf(childSourceToAdd, (visitedChildSource) => {
        const newNodeToAdd = Node.assocCreated(true)(visitedChildSource) // new node for the server
        delete newNodeToAdd[Node.keys.id] // clear internal id
        updateResult.addNode(newNodeToAdd, { sideEffect })
      })(recordSource)
    })

    // update existing nodes (nodes in both source and target records)

    _getNodesArrayIntersection(childrenSource, childrenTarget).forEach((childSource) => {
      const childTargetToUpdate = _findNodeWithSameUuid(childSource, childrenTarget)
      if (NodeDef.isAttribute(childDef)) {
        const attrUpdateResult = _replaceAttributeValueIfModifiedAfter({
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
        })
        updateResult.merge(childEntityUpdateResult)
      }
    })
  })
  return updateResult
}

export const replaceUpdatedNodes =
  ({ user, survey, recordSource, categoryItemProvider, taxonProvider, timezoneOffset, sideEffect = false }) =>
  async (recordTarget) => {
    const rootSource = RecordReader.getRootNode(recordSource)
    const rootTarget = RecordReader.getRootNode(recordTarget)
    if (Node.getUuid(rootTarget) !== Node.getUuid(rootSource)) {
      // it should never happen...
      throw new Error('error merging records: root entities have different uuids')
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
  const parentEntityUuid = Node.getUuid(parentEntity)
  node[Node.keys.parentUuid] = parentEntityUuid
  const hierarchyUpdated = [...Node.getHierarchy(parentEntity), parentEntityUuid]
  Objects.setInPath({ obj: node, path: [Node.keys.meta, Node.metaKeys.hierarchy], value: hierarchyUpdated })
}

const _addNodeToUpdateResult = ({
  updateResult,
  node,
  parentEntity: parentEntityParam = undefined,
  assignNewUuid = false,
  sideEffect = false,
}) => {
  const newNodeToAdd = sideEffect ? Node.setCreated(node) : Node.assocCreated(true)(node)
  if (assignNewUuid) {
    newNodeToAdd[Node.keys.uuid] = UUIDs.v4()
  }
  delete newNodeToAdd[Node.keys.id] // clear internal id
  newNodeToAdd[Node.keys.recordUuid] = updateResult.record.uuid

  const parentEntity = parentEntityParam ?? RecordReader.getNodeByUuid(Node.getParentUuid(node))(updateResult.record)
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
  return _replaceAttributeValueIfModifiedAfter({
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
  const childrenTargetToDeleteUuids = childrenTarget.map(Node.getUuid)
  const nodesDeleteUpdateResult = Records.deleteNodes(childrenTargetToDeleteUuids, { sideEffect })(updateResult.record)
  updateResult.merge(nodesDeleteUpdateResult)
  childrenSource.forEach((childSource) => {
    _addNodeToUpdateResult({ updateResult, node: childSource, parentEntity: entityTarget })
  })
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
      childrenSource.forEach((childSource) => {
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
          _addNodeToUpdateResult({ updateResult, node: childSource, parentEntity: entityTarget, assignNewUuid: true })
        }
      })
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
  const newNodeUuidByOldUuid = {}
  RecordReader.visitDescendantsAndSelf(entitySource, (visitedChildSource) => {
    const oldUuid = Node.getUuid(visitedChildSource)
    const oldParentUuid = Node.getParentUuid(visitedChildSource)
    const newUuid = UUIDs.v4()
    newNodeUuidByOldUuid[oldUuid] = newUuid
    const newParentEntityUuid =
      visitedChildSource === entitySource
        ? Node.getUuid(parentEntity)
        : newNodeUuidByOldUuid[oldParentUuid] ?? oldParentUuid
    const nodeTarget = ObjectUtils.clone(visitedChildSource)
    Node.removeFlags({ sideEffect: true })(nodeTarget)
    nodeTarget[Node.keys.created] = true // consider it as new node, to allow RDB updates
    nodeTarget[Node.keys.uuid] = newUuid
    nodeTarget[Node.keys.parentUuid] = newParentEntityUuid
    // node hierarchy will be recalculated in _addNodeToUpdateResult
    _addNodeToUpdateResult({ updateResult, node: nodeTarget, sideEffect })
  })(recordSource)
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
  childrenSource.forEach((childSource) => {
    const keyValuesByDefUuid = Records.getEntityKeyValuesByDefUuid({
      survey,
      cycle: recordSource.cycle,
      record: recordSource,
      entity: childSource,
    })
    const childTarget = findEntityByUuidOrKeys({
      survey,
      record: updateResult.record,
      entityDefUuid: childDefUuid,
      parentEntity: entityTarget,
      uuid: Node.getUuid(childSource),
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
  })
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
      childDefs.forEach((childDef) => {
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
      })
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
