import { Dates, Objects, Records, RecordUpdateResult, Surveys, UUIDs } from '@openforis/arena-core'
import type { ArenaRecord, ArenaRecordNode, ArenaNodeDef, NodeDefType, ArenaSurvey } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as ObjectUtils from '@core/objectUtils'

import { NodeValues } from '../nodeValues'
import { RecordEvaluationContext } from '../recordEvaluationContext'
import * as RecordReader from './recordReader'

import { updateAttributeValue } from './recordNodeValueUpdater'
import { afterNodesUpdate } from './recordNodesUpdaterCommon'

type AnyNodeDef = ArenaNodeDef<NodeDefType>
type KeyValuesByDefUuid = Record<string, unknown>
// entities (with the same uuid or keys) whose descendants must be merged
type EntitiesToMerge = { entitySource: ArenaRecordNode; entityTarget: ArenaRecordNode }

// updated nodes not triggering the dependents update
type PassiveNodeUuids = Set<string>

const findEntityByUuidOrKeys = ({
  survey,
  record,
  entityDefUuid,
  parentEntity,
  uuid = null,
  keyValuesByDefUuid = null,
}: {
  survey: ArenaSurvey
  record: ArenaRecord
  entityDefUuid: string
  parentEntity: ArenaRecordNode
  uuid?: string | null
  keyValuesByDefUuid?: KeyValuesByDefUuid | null
}): ArenaRecordNode | null | undefined => {
  const entityWithSameUuid = uuid ? Records.getNodeByUuid(uuid)(record) : null
  if (entityWithSameUuid) {
    return entityWithSameUuid
  }
  return keyValuesByDefUuid
    ? Records.findEntityByKeyValues(survey, undefined, parentEntity, entityDefUuid, keyValuesByDefUuid)(record)
    : null
}

const _findNodeWithSameUuid = (
  nodeSearch: ArenaRecordNode,
  nodesArray: ArenaRecordNode[]
): ArenaRecordNode | undefined => nodesArray.find((node) => Node.getUuid(node) === Node.getUuid(nodeSearch))

const _getNodesArrayDifference = (nodes: ArenaRecordNode[], otherNodes: ArenaRecordNode[]): ArenaRecordNode[] =>
  nodes.filter((node) => !_findNodeWithSameUuid(node, otherNodes))

const _getNodesArrayIntersection = (nodes: ArenaRecordNode[], otherNodes: ArenaRecordNode[]): ArenaRecordNode[] =>
  nodes.filter((node) => !!_findNodeWithSameUuid(node, otherNodes))

type AttributeSourceAndTarget = {
  survey: ArenaSurvey
  attrDef: AnyNodeDef
  recordTarget: ArenaRecord
  entityTarget: ArenaRecordNode
  attrSource: ArenaRecordNode
  attrTarget: ArenaRecordNode
}

const _areAttributeValuesEqual = ({
  survey,
  attrDef,
  recordTarget,
  entityTarget,
  attrSource,
  attrTarget,
}: AttributeSourceAndTarget): boolean => {
  const valueSource = Node.getValue(attrSource)
  const valueTarget = Node.getValue(attrTarget)
  if (Objects.isEmpty(valueSource) && Objects.isEmpty(valueTarget)) return true
  return NodeValues.isValueEqual({
    survey,
    nodeDef: attrDef,
    value: valueSource,
    valueSearch: valueTarget,
    record: recordTarget,
    parentNode: entityTarget,
  })
}

/**
 * Updates the target attribute with the source one when its value is different and newer (or the target one is empty).
 * Nodes added to passiveNodeUuids are persisted but they don't trigger the update of the dependent nodes:
 * attributes with the same value (only their date modified changes) and read-only attributes, whose value
 * was already calculated in the source record (e.g. by Arena Mobile) and is kept as it is.
 * @param params - The parameters.
 * @param params.survey - The survey.
 * @param params.attrDef - The attribute definition.
 * @param params.recordTarget - The record being updated.
 * @param params.entityTarget - The parent entity of the target attribute.
 * @param params.attrSource - The source attribute.
 * @param params.attrTarget - The target attribute.
 * @param params.passiveNodeUuids - Uuids of the updated nodes not triggering the dependents update.
 * @param params.sideEffect - Whether to update the record and the nodes in place.
 * @returns The update result or null if the attribute is not updated.
 */
const _replaceAttributeValueIfEmptyOrModified = ({
  survey,
  attrDef,
  recordTarget,
  entityTarget,
  attrSource,
  attrTarget,
  passiveNodeUuids,
  sideEffect,
}: AttributeSourceAndTarget & {
  passiveNodeUuids: PassiveNodeUuids
  sideEffect?: boolean
}): RecordUpdateResult | null => {
  const sourceDateModified = Node.getDateModified(attrSource)
  const sourceIsNewer = Dates.isAfter(sourceDateModified, Node.getDateModified(attrTarget))
  const valuesEqual = _areAttributeValuesEqual({ survey, attrDef, recordTarget, entityTarget, attrSource, attrTarget })
  if (valuesEqual) {
    if (!sourceIsNewer) return null
    // same value: only the date modified is updated
    const attrUpdated = A.pipe(Node.assocDateModified(sourceDateModified), Node.assocUpdated(true))(attrTarget)
    const updateResult = new RecordUpdateResult({ record: recordTarget })
    updateResult.addNode(attrUpdated, { sideEffect })
    passiveNodeUuids.add(Node.getUuid(attrTarget))
    return updateResult
  }
  if (!sourceIsNewer && !Node.isValueBlank(attrTarget)) return null

  const attributeUpdateResult = updateAttributeValue({
    survey,
    record: recordTarget,
    entity: entityTarget,
    attributeDef: attrDef,
    attribute: attrTarget,
    value: Node.getValue(attrSource),
    refData: NodeRefData.getRefData(attrSource),
    dateModified: sourceDateModified,
    sideEffect,
  })
  if (attributeUpdateResult && NodeDef.isReadOnly(attrDef)) {
    passiveNodeUuids.add(Node.getUuid(attrTarget))
  }
  return attributeUpdateResult
}

/**
 * Updates the dependents of the updated nodes, except the passive ones: they are kept as they are.
 * @param params - The afterNodesUpdate parameters.
 * @param params.updateResult - The result of the nodes update.
 * @param params.passiveNodeUuids - Uuids of the updated nodes not triggering the dependents update.
 * @returns The update result, including the dependent nodes.
 */
const _afterNodesUpdateExceptPassiveNodes = async ({
  updateResult,
  passiveNodeUuids,
  ...otherParams
}: {
  updateResult: RecordUpdateResult
  passiveNodeUuids: PassiveNodeUuids
  [contextParam: string]: unknown
}): Promise<RecordUpdateResult> => {
  const activeNodes: Record<string, ArenaRecordNode> = {}
  const passiveNodes: Record<string, ArenaRecordNode> = {}
  for (const [uuid, node] of Object.entries(updateResult.nodes)) {
    if (passiveNodeUuids.has(uuid)) {
      // copy: the dependents update could modify it in place
      passiveNodes[uuid] = { ...node }
    } else {
      activeNodes[uuid] = node
    }
  }
  return afterNodesUpdate({ ...otherParams, record: updateResult.record, nodes: activeNodes, passiveNodes })
}

type ChildrenSourceAndTarget = {
  childrenSource: ArenaRecordNode[]
  childrenTarget: ArenaRecordNode[]
  updateResult: RecordUpdateResult
  sideEffect?: boolean
}

// deletes the target nodes that are not in the source record
const _deleteTargetChildrenNotInSource = ({
  childrenSource,
  childrenTarget,
  updateResult,
  sideEffect,
}: ChildrenSourceAndTarget): void => {
  const childrenTargetToDelete = _getNodesArrayDifference(childrenTarget, childrenSource).map(Node.assocDeleted(true))
  if (childrenTargetToDelete.length === 0) return

  const childrenTargetToDeleteUuids = childrenTargetToDelete.map((child) => Node.getUuid(child))
  const nodesDeleteUpdateResult = Records.removeNodes(childrenTargetToDeleteUuids, { sideEffect })(updateResult.record)
  updateResult.merge(nodesDeleteUpdateResult)
}

// adds the source nodes (and their descendants) that are not in the target record
const _addSourceChildrenNotInTarget = ({
  childrenSource,
  childrenTarget,
  recordSource,
  updateResult,
  sideEffect,
}: ChildrenSourceAndTarget & { recordSource: ArenaRecord }): void => {
  for (const childSourceToAdd of _getNodesArrayDifference(childrenSource, childrenTarget)) {
    RecordReader.visitDescendantsAndSelf(childSourceToAdd, (visitedChildSource) => {
      const newNodeToAdd = Node.assocCreated(true)(visitedChildSource) // new node for the server
      // clear internal id (not deleted: it would switch the node to the V8 dictionary mode)
      newNodeToAdd[Node.keys.id] = undefined
      updateResult.addNode(newNodeToAdd, { sideEffect })
    })(recordSource)
  }
}

const _replaceUpdatedNodesInEntities = ({
  survey,
  recordSource,
  recordTarget,
  entitySource,
  entityTarget,
  passiveNodeUuids,
  sideEffect = false,
}: {
  survey: ArenaSurvey
  recordSource: ArenaRecord
  recordTarget: ArenaRecord
  entitySource: ArenaRecordNode
  entityTarget: ArenaRecordNode
  passiveNodeUuids: PassiveNodeUuids
  sideEffect?: boolean
}): RecordUpdateResult => {
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

    _deleteTargetChildrenNotInSource({ childrenSource, childrenTarget, updateResult, sideEffect })
    _addSourceChildrenNotInTarget({ childrenSource, childrenTarget, recordSource, updateResult, sideEffect })

    // update existing nodes (nodes in both source and target records)

    for (const childSource of _getNodesArrayIntersection(childrenSource, childrenTarget)) {
      const childTargetToUpdate = _findNodeWithSameUuid(childSource, childrenTarget)
      if (NodeDef.isAttribute(childDef)) {
        const attrUpdateResult = _replaceAttributeValueIfEmptyOrModified({
          survey,
          attrDef: childDef,
          recordTarget: updateResult.record,
          entityTarget,
          attrSource: childSource,
          attrTarget: childTargetToUpdate,
          passiveNodeUuids,
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
          passiveNodeUuids,
        })
        updateResult.merge(childEntityUpdateResult)
      }
    }
  }
  return updateResult
}

type CombineRecordsParams = {
  recordSource: ArenaRecord
  sideEffect?: boolean
  [contextParam: string]: unknown
}

export const replaceUpdatedNodes =
  ({ recordSource, sideEffect = false, ...otherParams }: CombineRecordsParams) =>
  async (recordTarget: ArenaRecord): Promise<RecordUpdateResult> => {
    const context = RecordEvaluationContext.extract(otherParams)
    const { survey } = context
    const rootSource = RecordReader.getRootNode(recordSource)
    const rootTarget = RecordReader.getRootNode(recordTarget)
    if (Node.getUuid(rootTarget) !== Node.getUuid(rootSource)) {
      // it should never happen...
      throw new Error('error merging records: root entities have different uuids')
    }
    const passiveNodeUuids: PassiveNodeUuids = new Set()
    const updateResult = _replaceUpdatedNodesInEntities({
      survey,
      recordSource,
      recordTarget,
      entitySource: rootSource,
      entityTarget: rootTarget,
      passiveNodeUuids,
      sideEffect,
    })
    return _afterNodesUpdateExceptPassiveNodes({ ...context, updateResult, passiveNodeUuids, sideEffect })
  }

const _recalculateNodeHierarchy = ({
  parentEntity,
  node,
}: {
  parentEntity: ArenaRecordNode
  node: ArenaRecordNode
}): void => {
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
}: {
  updateResult: RecordUpdateResult
  node: ArenaRecordNode
  parentEntity?: ArenaRecordNode
  assignNewUuid?: boolean
  sideEffect?: boolean
}): void => {
  const newNodeToAdd = sideEffect ? Node.setCreated(node) : Node.assocCreated(true)(node)
  if (assignNewUuid) {
    newNodeToAdd[Node.keys.uuid] = UUIDs.v4()
  }
  // clear internal id (not deleted: it would switch the node to the V8 dictionary mode)
  newNodeToAdd[Node.keys.id] = undefined
  newNodeToAdd[Node.keys.recordUuid] = updateResult.record.uuid

  const parentEntity = parentEntityParam ?? RecordReader.getNodeByUuid(Node.getParentUuid(node))(updateResult.record)
  _recalculateNodeHierarchy({ node: newNodeToAdd, parentEntity })
  updateResult.addNode(newNodeToAdd, { sideEffect })
}

// when a record is merged with another version of itself (same record uuid, e.g. the copy of it edited
// in a mobile device), the nodes added from the source keep their uuids: the client can then keep working
// on its own copy and merge it again without the same nodes being added twice (or not found anymore).
// Nodes coming from a different record always get new uuids: the source record can exist on its own.
const _canKeepNodeUuid = ({
  keepNodeUuids,
  record,
  node,
}: {
  keepNodeUuids: boolean
  record: ArenaRecord
  node: ArenaRecordNode
}): boolean => keepNodeUuids && !RecordReader.getNodeByUuid(Node.getUuid(node))(record)

const _mergeSingleAttributeValues = ({
  survey,
  record,
  childDef,
  entityTarget,
  childSource,
  childTarget,
  passiveNodeUuids,
  sideEffect,
}: {
  survey: ArenaSurvey
  record: ArenaRecord
  childDef: AnyNodeDef
  entityTarget: ArenaRecordNode
  childSource: ArenaRecordNode
  childTarget: ArenaRecordNode
  passiveNodeUuids: PassiveNodeUuids
  sideEffect?: boolean
}): RecordUpdateResult | null => {
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
    passiveNodeUuids,
    sideEffect,
  })
}

const _areNotSameValues = ({
  survey,
  childDef,
  updateResult,
  entityTarget,
  sourceValues,
  targetValues,
}: {
  survey: ArenaSurvey
  childDef: AnyNodeDef
  updateResult: RecordUpdateResult
  entityTarget: ArenaRecordNode
  sourceValues: unknown[]
  targetValues: unknown[]
}): boolean =>
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

type ChildrenToMerge = {
  updateResult: RecordUpdateResult
  childrenSource: ArenaRecordNode[]
  childrenTarget: ArenaRecordNode[]
  entityTarget: ArenaRecordNode
  sideEffect?: boolean
}

const replaceNodes = ({ childrenSource, childrenTarget, entityTarget, sideEffect, updateResult }: ChildrenToMerge) => {
  const childrenTargetToDeleteUuids = childrenTarget.map((child) => Node.getUuid(child))
  const nodesDeleteUpdateResult = Records.removeNodes(childrenTargetToDeleteUuids, { sideEffect })(updateResult.record)
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
  keepNodeUuids,
  sideEffect,
}: ChildrenToMerge & { survey: ArenaSurvey; childDef: AnyNodeDef; keepNodeUuids: boolean }): void => {
  if (childrenSource.length > 0) {
    const sourceValues = childrenSource.map((child) => Node.getValue(child))
    const targetValues = childrenTarget.map((child) => Node.getValue(child))

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
          !targetValues.some((targetValue) =>
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
          const assignNewUuid = !_canKeepNodeUuid({ keepNodeUuids, record: updateResult.record, node: childSource })
          _addNodeToUpdateResult({ updateResult, node: childSource, parentEntity: entityTarget, assignNewUuid })
        }
      }
    }
  }
}

const _cloneEntityAndDescendants = ({
  updateResult,
  recordSource,
  entitySource,
  parentEntity,
  keepNodeUuids = false,
  sideEffect = false,
}: {
  updateResult: RecordUpdateResult
  recordSource: ArenaRecord
  entitySource: ArenaRecordNode
  parentEntity: ArenaRecordNode
  keepNodeUuids?: boolean
  sideEffect?: boolean
}): void => {
  const newNodeUuidByOldUuid: Record<string, string> = {}
  RecordReader.visitDescendantsAndSelf(entitySource, (visitedChildSource) => {
    const oldUuid = Node.getUuid(visitedChildSource)
    const oldParentUuid = Node.getParentUuid(visitedChildSource)
    const newUuid = _canKeepNodeUuid({ keepNodeUuids, record: updateResult.record, node: visitedChildSource })
      ? oldUuid
      : UUIDs.v4()
    newNodeUuidByOldUuid[oldUuid] = newUuid
    const newParentEntityUuid =
      visitedChildSource === entitySource
        ? Node.getUuid(parentEntity)
        : (newNodeUuidByOldUuid[oldParentUuid] ?? oldParentUuid)
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
  keepNodeUuids = false,
  sideEffect = false,
}: {
  updateResult: RecordUpdateResult
  survey: ArenaSurvey
  recordSource: ArenaRecord
  childDefUuid: string
  childrenSource: ArenaRecordNode[]
  entityTarget: ArenaRecordNode
  stack: EntitiesToMerge[]
  keepNodeUuids?: boolean
  sideEffect?: boolean
}): void => {
  for (const childSource of childrenSource) {
    const keyValuesByDefUuid = Records.getEntityKeyValuesByDefUuid(
      survey,
      childSource,
      recordSource.cycle
    )(recordSource)
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
        keepNodeUuids,
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
  keepNodeUuids,
  passiveNodeUuids,
  sideEffect,
}: {
  updateResult: RecordUpdateResult
  survey: ArenaSurvey
  childDef: AnyNodeDef
  recordSource: ArenaRecord
  entitySource: ArenaRecordNode
  entityTarget: ArenaRecordNode
  stack: EntitiesToMerge[]
  keepNodeUuids: boolean
  passiveNodeUuids: PassiveNodeUuids
  sideEffect?: boolean
}): void => {
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
          passiveNodeUuids,
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
      keepNodeUuids,
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
      keepNodeUuids,
      sideEffect,
    })
  }
}

export const mergeRecords =
  ({ recordSource, sideEffect = false, ...otherParams }: CombineRecordsParams) =>
  async (recordTarget: ArenaRecord): Promise<RecordUpdateResult> => {
    const context = RecordEvaluationContext.extract(otherParams)
    const { survey } = context
    const { cycle } = recordTarget
    const rootSource = RecordReader.getRootNode(recordSource)
    const rootTarget = RecordReader.getRootNode(recordTarget)

    const updateResult = new RecordUpdateResult({ record: recordTarget })

    const recordUuid = ObjectUtils.getUuid(recordTarget)
    const keepNodeUuids = !!recordUuid && recordUuid === ObjectUtils.getUuid(recordSource)

    const passiveNodeUuids: PassiveNodeUuids = new Set()
    const stack: EntitiesToMerge[] = [{ entitySource: rootSource, entityTarget: rootTarget }]
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
          keepNodeUuids,
          passiveNodeUuids,
          sideEffect,
        })
      }
    }
    return _afterNodesUpdateExceptPassiveNodes({ ...context, updateResult, passiveNodeUuids, sideEffect })
  }
