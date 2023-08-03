import {
  RecordUpdater as CoreRecordUpdater,
  RecordNodesUpdater as CoreRecordNodesUpdater,
  RecordValidator,
  RecordUpdateResult,
  Objects,
} from '@openforis/arena-core'

import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'
import SystemError from '@core/systemError'

import { NodeValues } from '../nodeValues'
import * as RecordReader from './recordReader'
import { NodeValueFormatter } from '../nodeValueFormatter'

const { createNodeAndDescendants, createRootEntity } = CoreRecordUpdater
const { updateNodesDependents } = CoreRecordNodesUpdater

const _valueAdapterByType = {
  [NodeDef.nodeDefType.code]: ({ survey, record, parentNode, attributeDef, value }) => {
    if (value[Node.valuePropsCode.itemUuid]) {
      return value
    }
    const code = value[Node.valuePropsCode.code]
    if (!code) {
      return null
    }
    const { itemUuid } = Survey.getCategoryItemUuidAndCodeHierarchy({
      nodeDef: attributeDef,
      code,
      record,
      parentNode,
    })(survey)
    if (!itemUuid) {
      throw new SystemError('validationErrors.dataImport.invalidCode', { code })
    }
    return Node.newNodeValueCode({ itemUuid })
  },
}

const _adaptValue = ({ survey, record, parentNode, attributeDef, value }) => {
  const valueAdapter = _valueAdapterByType[NodeDef.getType(attributeDef)]
  return valueAdapter ? valueAdapter({ survey, record, parentNode, attributeDef, value }) : value
}

const _updateAttributeValue = ({
  survey,
  record,
  entity,
  attributeDef,
  attribute,
  value,
  dateModified = new Date(),
  sideEffect = false,
}) => {
  if (
    !NodeValues.isValueEqual({
      survey,
      nodeDef: attributeDef,
      value: Node.getValue(attribute),
      valueSearch: value,
      record,
      parentNode: entity,
      strict: true,
    })
  ) {
    // update existing attribute (if value changed)
    const attributeUpdated = A.pipe(
      Node.assocValue(value),
      // reset default value applied flag
      Node.assocMeta({ ...Node.getMeta(attribute), [Node.metaKeys.defaultValue]: false }),
      Node.assocUpdated(true),
      (nodeUpdated) => (dateModified ? Node.assocDateModified(dateModified)(nodeUpdated) : nodeUpdated)
    )(attribute)

    const updateResult = new RecordUpdateResult({ record })
    updateResult.addNode(attributeUpdated, { sideEffect })
    return updateResult
  }
  // no updates performed
  return null
}

const _addOrUpdateAttribute =
  ({ survey, entity, attributeDef, value: valueParam, sideEffect = false }) =>
  (record) => {
    const attributeDefUuid = NodeDef.getUuid(attributeDef)
    const attribute = RecordReader.getNodeChildByDefUuid(entity, attributeDefUuid)(record)

    const value = _adaptValue({ survey, record, parentNode: entity, attributeDef, value: valueParam })

    if (!attribute) {
      // create new attribute
      const updateResult = new RecordUpdateResult({ record })
      const attributeCreated = Node.newNode(attributeDefUuid, record.uuid, entity, value)
      updateResult.addNode(attributeCreated, { sideEffect })
      return updateResult
    }
    return _updateAttributeValue({ survey, record, entity, attributeDef, attribute, value, sideEffect })
  }

const _addEntityAndKeyValues =
  ({ survey, entityDef, parentNode, keyValuesByDefUuid, sideEffect = false }) =>
  (record) => {
    const updateResult = new RecordUpdateResult({ record })
    const updateResultDescendants = CoreRecordNodesUpdater.createNodeAndDescendants({
      survey,
      record,
      parentNode,
      nodeDef: entityDef,
      sideEffect,
    })
    updateResult.merge(updateResultDescendants)

    const entity = Object.values(updateResultDescendants.nodes).find(
      (node) => Node.getNodeDefUuid(node) === NodeDef.getUuid(entityDef)
    )

    const keyDefs = Survey.getNodeDefKeys(entityDef)(survey)
    keyDefs.forEach((keyDef) => {
      const keyValue = keyValuesByDefUuid[NodeDef.getUuid(keyDef)]

      if (Objects.isEmpty(keyValue)) {
        throw new SystemError('record.entity.keyValueNotSpecified', {
          keyDefName: NodeDef.getName(keyDef),
        })
      }

      const keyAttributeUpdateResult = _addOrUpdateAttribute({
        survey,
        entity,
        attributeDef: keyDef,
        value: keyValue,
        sideEffect,
      })(updateResult.record)

      if (keyAttributeUpdateResult) {
        updateResult.merge(keyAttributeUpdateResult)
      }
    })
    return { entity, updateResult }
  }

const _getOrCreateEntityByKeys =
  ({ survey, entityDefUuid, valuesByDefUuid, insertMissingNodes, sideEffect = false }) =>
  (record) => {
    if (NodeDef.getUuid(Survey.getNodeDefRoot(survey)) === entityDefUuid) {
      return { entity: RecordReader.getRootNode(record), updateResult: null }
    }
    const entity = RecordReader.findDescendantByKeyValues({
      survey,
      descendantDefUuid: entityDefUuid,
      keyValuesByDefUuid: valuesByDefUuid,
    })(record)

    if (entity) {
      return { entity, updateResult: null }
    }
    // entity doesn't exist
    const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)

    if (!insertMissingNodes) {
      const keyDefs = Survey.getNodeDefKeys(entityDef)(survey)
      const keyValuePairs = keyDefs
        .map((keyDef) => {
          const keyDefUuid = NodeDef.getUuid(keyDef)
          const keyDefName = NodeDef.getName(keyDef)
          const value = valuesByDefUuid[keyDefUuid]
          const keyValue = NodeValueFormatter.format({ survey, nodeDef: keyDef, value })
          return `${keyDefName}=${keyValue}`
        })
        .join(',')
      throw new SystemError('appErrors.record.entityNotFound', {
        entityName: NodeDef.getName(entityDef),
        keyValues: keyValuePairs,
      })
    }

    // insert missing entity node (with keys)
    const entityParentDef = Survey.getNodeDefParent(entityDef)(survey)
    const entityParent = RecordReader.findDescendantByKeyValues({
      survey,
      descendantDefUuid: NodeDef.getUuid(entityParentDef),
      keyValuesByDefUuid: valuesByDefUuid,
    })(record)

    if (!entityParent) {
      throw new SystemError('record.cannotFindAncestorForEntity', {
        entityName: NodeDef.getName(entityDef),
        ancestorName: NodeDef.getName(entityParentDef),
      })
    }
    const { entity: entityInserted, updateResult } = _addEntityAndKeyValues({
      survey,
      entityDef,
      parentNode: entityParent,
      keyValuesByDefUuid: valuesByDefUuid,
      sideEffect,
    })(record)

    return { entity: entityInserted, updateResult }
  }

const _afterNodesUpdate = async ({ survey, record, nodes, sideEffect = false }) => {
  // output
  const updateResult = new RecordUpdateResult({ record, nodes })

  // 1. update dependent nodes
  const updateResultDependents = updateNodesDependents({
    survey,
    record,
    nodes,
    sideEffect,
  })

  updateResult.merge(updateResultDependents)

  // 2. update node validations
  const nodesValidation = await RecordValidator.validateNodes({
    survey,
    record: updateResult.record,
    nodes: updateResult.nodes,
  })
  const recordValidationUpdated = A.pipe(
    Validation.getValidation,
    Validation.mergeValidation(nodesValidation),
    Validation.updateCounts
  )(updateResult.record)
  updateResult.record = Validation.assocValidation(recordValidationUpdated)(updateResult.record)

  return updateResult
}

const updateAttributesWithValues =
  ({ survey, entityDefUuid, valuesByDefUuid, insertMissingNodes = false, sideEffect = false }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    // 1. get or create context entity
    const { entity, updateResult: updateResultEntity } = _getOrCreateEntityByKeys({
      survey,
      entityDefUuid,
      valuesByDefUuid,
      insertMissingNodes,
      sideEffect,
    })(record)

    if (updateResultEntity) {
      updateResult.merge(updateResultEntity)
    }

    // 2. update attribute values
    const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
    Object.entries(valuesByDefUuid).forEach(([attributeDefUuid, value]) => {
      const attributeDef = Survey.getNodeDefByUuid(attributeDefUuid)(survey)
      if (
        NodeDef.isDescendantOf(entityDef)(attributeDef) &&
        (NodeDef.isRoot(entityDef) || !NodeDef.isKey(attributeDef)) &&
        !NodeDef.isReadOnly(attributeDef)
      ) {
        const { record: currentRecord } = updateResult

        const attributeParentEntity = RecordReader.getNodeParentInDescendantSingleEntities({
          survey,
          parentNode: entity,
          nodeDefUuid: attributeDefUuid,
        })(currentRecord)

        const attributeUpdateResult = _addOrUpdateAttribute({
          survey,
          entity: attributeParentEntity,
          attributeDef,
          value,
          sideEffect,
        })(currentRecord)

        if (attributeUpdateResult) {
          updateResult.merge(attributeUpdateResult)
        }
      }
    })

    return _afterNodesUpdate({ survey, record: updateResult.record, nodes: updateResult.nodes, sideEffect })
  }

const _findNodeWithSameUuid = (nodeSearch, nodesArray) =>
  nodesArray.filter((node) => Node.getUuid(node) === Node.getUuid(nodeSearch))

const _getNodesArrayDifference = (nodes, otherNodes) => nodes.filter((node) => !_findNodeWithSameUuid(node, otherNodes))

const _getNodesArrayIntersection = (nodes, otherNodes) =>
  nodes.filter((node) => !!_findNodeWithSameUuid(node, otherNodes))

const _mergeEntities = ({ survey, recordSource, recordTarget, entitySource, entityTarget }) => {
  const updateResult = new RecordUpdateResult({ record: recordTarget })

  const entityDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(entitySource))(survey)

  const entityTargetUpdated = Node.assocMeta(Node.getMeta(entitySource))(entityTarget)
  updateResult.addNode(entityTargetUpdated)

  Survey.getNodeDefChildren(
    entityDef,
    false
  )(survey).forEach((childDef) => {
    const childDefUuid = NodeDef.getUuid(childDef)

    const childrenSource = RecordReader.getNodeChildrenByDefUuidUnsorted(entitySource, childDefUuid)(recordSource)
    const childrenTarget = RecordReader.getNodeChildrenByDefUuidUnsorted(
      entitySource,
      childDefUuid
    )(updateResult.record)

    // delete nodes that are not in source record
    const childrenTargetToDelete = _getNodesArrayDifference(childrenTarget, childrenSource).map(Node.assocDeleted)
    if (childrenTargetToDelete.length > 0) {
      const nodesIndexedByUuid = ObjectUtils.toUuidIndexedObj(childrenTargetToDelete)
      const nodesDeleteUpdateResult = CoreRecordNodesUpdater.removeNodes({ nodes: nodesIndexedByUuid })(
        updateResult.record
      )
      updateResult.merge(nodesDeleteUpdateResult)
    }

    // add new nodes (in source record but not in target record) to updateResult (and record)
    _getNodesArrayDifference(childrenSource, childrenTarget).forEach((childSourceToAdd) => {
      RecordReader.visitDescendantsAndSelf(childSourceToAdd, (node) => {
        const nodeUpdated = Node.assocCreated(node) // new node for the server
        updateResult.addNode(nodeUpdated)
      })(updateResult.record)
    })

    // update existing nodes (nodes in both source and target records)

    _getNodesArrayIntersection(childrenSource, childrenTarget).forEach((childTargetToUpdate) => {
      const childSource = childrenSource.find(
        (childSource) => Node.getUuid(childSource) === Node.getUuid(childTargetToUpdate)
      )
      if (NodeDef.isAttribute(childDef)) {
        const attributeUpdateResult = _updateAttributeValue({
          survey,
          record: updateResult.record,
          entity: entityTarget,
          attribute: childTargetToUpdate,
          value: Node.getValue(childSource),
          dateModified: Node.getDateModified(childSource),
          sideEffect: true,
        })
        if (attributeUpdateResult) {
          updateResult.merge(attributeUpdateResult)
        }
      } else {
        const childEntityUpdateResult = _mergeEntities({
          survey,
          recordSource,
          recordTarget: updateResult.record,
          entitySource: childSource,
          entityTarget: childTargetToUpdate,
        })
        if (childEntityUpdateResult) {
          updateResult.merge(childEntityUpdateResult)
        }
      }
    })
  })
  return updateResult
}

const mergeRecords = ({ survey, recordSource, recordTarget }) => {
  const rootTarget = RecordReader.getRootNode(recordTarget)
  const rootSource = RecordReader.getRootNode(recordSource)
  if (Node.getUuid(rootTarget) !== Node.getUuid(rootSource)) {
    // it should never happen...
    throw new Error('error merging records: root entities have different uuids')
  }
  return _mergeEntities({ survey, recordSource, recordTarget, entitySource: rootSource, entityTarget: rootTarget })
}

export const RecordNodesUpdater = {
  createNodeAndDescendants,
  createRootEntity,
  updateNodesDependents,
  updateAttributesWithValues,
  mergeRecords,
}
