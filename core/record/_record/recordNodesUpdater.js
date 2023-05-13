import {
  RecordUpdater as CoreRecordUpdater,
  RecordNodesUpdater as CoreRecordNodesUpdater,
  RecordValidator,
  RecordUpdateResult,
} from '@openforis/arena-core'

import * as A from '@core/arena'
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
        Node.assocMeta({ ...Node.getMeta(attribute), [Node.metaKeys.defaultValue]: false })
      )(attribute)

      const updateResult = new RecordUpdateResult({ record })
      updateResult.addNode(attributeUpdated, { sideEffect })
      return updateResult
    }
    // no updates performed
    return null
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

export const RecordNodesUpdater = {
  createNodeAndDescendants,
  createRootEntity,
  updateNodesDependents,
  updateAttributesWithValues,
}
