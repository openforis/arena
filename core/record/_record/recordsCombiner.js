import { Dates, Objects, Records, RecordUpdateResult, Surveys } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import { NodeValues } from '../nodeValues'
import * as RecordReader from './recordReader'

import { updateAttributeValue } from './recordNodeValueUpdater'
import { afterNodesUpdate } from './recordNodesUpdaterCommon'

const findEntityByUuidOrKeys = ({ survey, record, entityDefUuid, parentEntity, uuid, keyValuesByDefUuid }) => {
  const entityWithSameUuid = Records.getNodeByUuid(uuid)(record)
  return (
    entityWithSameUuid ??
    Records.findEntityByKeyValues({ survey, record, parentEntity, entityDefUuid, keyValuesByDefUuid })
  )
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
    updateResult.addNode(entityTargetUpdated)
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
        updateResult.addNode(newNodeToAdd)
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
  ({ survey, recordSource, timezoneOffset, sideEffect = false }) =>
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
      survey,
      record: updateResult.record,
      nodes: updateResult.nodes,
      timezoneOffset,
      sideEffect,
    })
  }

const _addNodeToUpdateResult = ({ updateResult, node, parentUuid = undefined }) => {
  const newNodeToAdd = Node.assocCreated(true)(node)
  delete newNodeToAdd[Node.keys.id] // clear internal id
  newNodeToAdd[Node.keys.recordUuid] = updateResult.record.uuid
  if (parentUuid) {
    newNodeToAdd[Node.keys.parentUuid] = parentUuid
  }
  updateResult.addNode(newNodeToAdd)
}

const _mergeRecordsNodes = ({
  survey,
  childDef,
  recordSource,
  recordTarget,
  entitySource,
  entityTarget,
  updateResult,
  stack,
  sideEffect,
}) => {
  const childDefUuid = NodeDef.getUuid(childDef)
  const childrenSource = RecordReader.findNodeChildren(entitySource, childDefUuid)(recordSource)
  const childrenTarget = RecordReader.findNodeChildren(entityTarget, childDefUuid)(recordTarget)
  if (NodeDef.isSingle(childDef)) {
    const childSource = childrenSource[0]
    const childTarget = childrenTarget[0]
    if (childSource && childTarget) {
      if (NodeDef.isAttribute(childDef)) {
        // single attribute
        const attrUpdateResult = _replaceAttributeValueIfModifiedAfter({
          survey,
          attrDef: childDef,
          recordTarget: updateResult.record,
          entityTarget,
          attrSource: childSource,
          attrTarget: childTarget,
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
    childrenSource.forEach((childSource) => {
      const keyValuesByDefUuid = Records.getEntityKeyValuesByDefUuid({
        survey,
        record: recordSource,
        entity: childSource,
      })
      const childTarget = findEntityByUuidOrKeys({
        survey,
        record: recordTarget,
        entityDefUuid: childDefUuid,
        parentEntity: entityTarget,
        uuid: Node.getUuid(childSource),
        keyValuesByDefUuid,
      })
      if (childTarget) {
        // entity found: nested nodes will be merged
        stack.push({ entitySource: childSource, entityTarget: childTarget })
      } else {
        // add new enities
        RecordReader.visitDescendantsAndSelf(childSource, (visitedChildSource) => {
          const parentUuid = visitedChildSource === childSource ? Node.getUuid(entityTarget) : undefined
          _addNodeToUpdateResult({ updateResult, node: visitedChildSource, parentUuid })
        })(recordSource)
      }
    })
  } else {
    // multiple attributes merge
    const sourceValues = childrenSource.map(Node.getValue)
    const targetValues = childrenTarget.map(Node.getValue)
    if (
      (sourceValues.length > 0 && sourceValues.length !== targetValues.length) ||
      sourceValues.some((sourceValue, index) => {
        const targetValue = childrenTarget[index]
        return !NodeValues.isValueEqual({
          survey,
          nodeDef: childDef,
          value: sourceValue,
          valueSearch: targetValue,
          record: updateResult.record,
          parentNode: entityTarget,
        })
      })
    ) {
      // different values, replace all nodes
      const childrenTargetToDeleteUuids = childrenTarget.map(Node.getUuid)
      const nodesDeleteUpdateResult = Records.deleteNodes(childrenTargetToDeleteUuids, { sideEffect })(
        updateResult.record
      )
      updateResult.merge(nodesDeleteUpdateResult)
      childrenSource.forEach((childSource) => {
        _addNodeToUpdateResult({ updateResult, node: childSource, parentUuid: Node.getUuid(entityTarget) })
      })
    }
  }
}

export const mergeRecords =
  ({ survey, recordSource, timezoneOffset, sideEffect = false }) =>
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
          survey,
          childDef,
          recordSource,
          recordTarget,
          entitySource,
          entityTarget,
          stack,
          updateResult,
          sideEffect,
        })
      })
    }
    return afterNodesUpdate({
      survey,
      record: updateResult.record,
      nodes: updateResult.nodes,
      timezoneOffset,
      sideEffect,
    })
  }
