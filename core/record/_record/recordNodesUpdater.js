import { RecordNodesUpdater as CoreRecordNodesUpdater, RecordValidator } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import { NodeValues } from '../nodeValues'
import * as RecordReader from './recordReader'
import RecordUpdateResult from './RecordUpdateResult'

const updateNodesDependents = CoreRecordNodesUpdater.updateNodesDependents

const _addOrUpdateAttribute =
  ({ survey, entity, attributeDef, value }) =>
  (record) => {
    const attributeDefUuid = NodeDef.getUuid(attributeDef)
    const attribute = RecordReader.getNodeChildByDefUuid(entity, attributeDefUuid)(record)

    if (!attribute) {
      // create new attribute
      const updateResult = new RecordUpdateResult({ record })
      const attributeCreated = Node.newNode(attributeDefUuid, record.uuid, entity, value)
      updateResult.addNode(attributeCreated)
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
      })
    ) {
      // update existing attribute (if value changed)
      const attributeUpdated = A.pipe(
        Node.assocValue(value),
        // reset default value applied flag
        Node.assocMeta({ ...Node.getMeta(attribute), [Node.metaKeys.defaultValue]: false })
      )(attribute)

      const updateResult = new RecordUpdateResult({ record })
      updateResult.addNode(attributeUpdated)
      return updateResult
    }
    // no updates performed
    return null
  }

const _addEntityAndKeyValues =
  ({ survey, entityDef, parentNode, keyValuesByDefUuid }) =>
  (record) => {
    const updateResult = new RecordUpdateResult({ record })
    const updateResultDescendants = CoreRecordNodesUpdater.addNodeAndDescendants({
      survey,
      record,
      parentNode,
      nodeDef: entityDef,
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
      })(updateResult.record)
      if (keyAttributeUpdateResult) {
        updateResult.merge(keyAttributeUpdateResult)
      }
    })
    return { entity, updateResult }
  }

const _getOrCreateEntityByKeys =
  ({ survey, entityDefUuid, valuesByDefUuid, insertMissingNodes }) =>
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
    if (!insertMissingNodes) {
      throw new Error('entity not found')
    }
    // insert entity node (with keys)
    const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
    const entityParentDef = Survey.getNodeDefAncestorMultipleEntity(entityDef)(survey)
    const entityParent = RecordReader.findDescendantByKeyValues({
      survey,
      descendantDefUuid: NodeDef.getUuid(entityParentDef),
      keyValuesByDefUuid: valuesByDefUuid,
    })(record)
    if (!entityParent) {
      throw new Error('cannot find ancestor node to create entity into')
    }
    const { entity: entityInserted, updateResult } = _addEntityAndKeyValues({
      survey,
      entityDef,
      parentNode: entityParent,
      keyValuesByDefUuid: valuesByDefUuid,
    })(record)
    return { entity: entityInserted, updateResult }
  }

const _afterNodesUpdate = async ({ survey, record, nodes }) => {
  // output
  const updateResult = new RecordUpdateResult({ record, nodes })

  // 1. update dependent nodes
  const updateResultDependents = updateNodesDependents({
    survey,
    record,
    nodes,
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
  ({ survey, entityDefUuid, valuesByDefUuid, insertMissingNodes = false }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    // 1. get or create context entity
    const { entity, updateResult: updateResultEntity } = _getOrCreateEntityByKeys({
      survey,
      entityDefUuid,
      valuesByDefUuid,
      insertMissingNodes,
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
        const attributeParentEntity = RecordReader.getNodeParentInDescendantSingleEntities({
          survey,
          parentNode: entity,
          nodeDefUuid: attributeDefUuid,
        })(updateResult.record)
        const attributeUpdateResult = _addOrUpdateAttribute({
          survey,
          entity: attributeParentEntity,
          attributeDef,
          value,
        })(updateResult.record)

        if (attributeUpdateResult) {
          updateResult.merge(attributeUpdateResult)
        }
      }
    })

    return _afterNodesUpdate({ survey, record: updateResult.record, nodes: updateResult.nodes })
  }

export const RecordNodesUpdater = {
  updateNodesDependents,
  updateAttributesWithValues,
}
