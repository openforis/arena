import {
  Objects,
  RecordUpdater as CoreRecordUpdater,
  RecordNodesUpdater as CoreRecordNodesUpdater,
  RecordUpdateResult,
  NodeValues,
} from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as NodeRefData from '../nodeRefData'
import * as CategoryItem from '@core/survey/categoryItem'
import SystemError from '@core/systemError'

import { RecordEvaluationContext } from '../recordEvaluationContext'
import * as RecordReader from './recordReader'
import { NodeValueFormatter } from '../nodeValueFormatter'
import { updateAttributeValue } from './recordNodeValueUpdater'

const { createRootEntity, deleteNodes } = CoreRecordUpdater
const { updateNodesDependents } = CoreRecordNodesUpdater

import { afterNodesUpdate } from './recordNodesUpdaterCommon'

const getKeyValuePairs = ({ survey, entityDef, valuesByDefUuid }) => {
  const keyDefs = Survey.getNodeDefKeys(entityDef)(survey)
  return keyDefs
    .map((keyDef) => {
      const keyDefUuid = NodeDef.getUuid(keyDef)
      const keyDefName = NodeDef.getName(keyDef)
      const value = valuesByDefUuid[keyDefUuid]
      const keyValue = NodeValueFormatter.format({ survey, nodeDef: keyDef, value })
      return `${keyDefName}=${keyValue}`
    })
    .join(',')
}

const _getOrFetchCategoryItem = async ({ survey, categoryItemProvider, attribute }) => {
  const refDataItem = NodeRefData.getCategoryItem(attribute)
  if (refDataItem) {
    return refDataItem
  }
  const value = Node.getValue(attribute)
  const itemUuid = NodeValues.getValueItemUuid(value)
  if (!itemUuid) {
    return null
  }
  const itemInSurvey = Survey.getCategoryItemByUuid(itemUuid)(survey)
  if (itemInSurvey) {
    return itemInSurvey
  }
  const nodeDefUuid = Node.getNodeDefUuid(attribute)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  return categoryItemProvider.getItemByUuid({ survey, categoryUuid, itemUuid })
}

const _getCodeAttributeCode = async ({ survey, categoryItemProvider, attribute }) => {
  const value = Node.getValue(attribute)
  const code = NodeValues.getValueCode(value)
  if (Objects.isNotEmpty(code)) {
    return code
  }
  const item = await _getOrFetchCategoryItem({ survey, categoryItemProvider, attribute })
  return item ? CategoryItem.getCode(item) : null
}

const _findCategoryItemUuidByAttribute = async ({
  survey,
  categoryItemProvider,
  record,
  parentNode,
  attributeDef,
  value,
}) => {
  const valueItemUuid = NodeValues.getValueItemUuid(value)
  if (valueItemUuid) {
    return valueItemUuid
  }
  const code = NodeValues.getValueCode(value)
  if (Objects.isEmpty(code)) {
    return null
  }
  const { itemUuid } = Survey.getCategoryItemUuidAndCodeHierarchy({
    nodeDef: attributeDef,
    code,
    record,
    parentNode,
  })(survey)
  if (itemUuid) {
    return itemUuid
  }
  const categoryUuid = NodeDef.getCategoryUuid(attributeDef)
  const ancestorCodeAttributes = RecordReader.getAncestorCodeAttributes({ survey, parentNode, nodeDef: attributeDef })(
    record
  )
  const ancestorCodes = await Promise.all(
    ancestorCodeAttributes.map((attribute) => _getCodeAttributeCode({ survey, categoryItemProvider, attribute }))
  )
  if (ancestorCodes.some(Objects.isEmpty)) {
    return null
  }
  const codePaths = [...ancestorCodes, code]
  const item = await categoryItemProvider.getItemByCodePaths({ survey, categoryUuid, codePaths })
  return item ? item.uuid : null
}

const _valueAdapterByType = {
  [NodeDef.nodeDefType.code]: async ({ survey, categoryItemProvider, record, parentNode, attributeDef, value }) => {
    if (NodeValues.getValueItemUuid(value)) {
      return value
    }
    const itemUuid = await _findCategoryItemUuidByAttribute({
      survey,
      categoryItemProvider,
      record,
      parentNode,
      attributeDef,
      value,
    })
    if (!itemUuid) {
      const attributeName = NodeDef.getName(attributeDef)
      throw new SystemError('validationErrors:dataImport.invalidCode', {
        attributeName,
        code: NodeValues.getValueCode(value),
      })
    }
    return Node.newNodeValueCode({ itemUuid })
  },
}

// params (context) are the ones of RecordEvaluationContext: providers are taken from there
const _adaptValue = async ({ context, record, parentNode, attributeDef, value }) => {
  const valueAdapter = _valueAdapterByType[NodeDef.getType(attributeDef)]
  return valueAdapter ? valueAdapter({ ...context, record, parentNode, attributeDef, value }) : value
}

const _addOrUpdateAttribute =
  ({ context, entity, attributeDef, value: valueParam, refData = null, sideEffect = false }) =>
  async (record) => {
    const { survey } = context
    const attributeDefUuid = NodeDef.getUuid(attributeDef)
    const attribute = RecordReader.getNodeChildByDefUuid(entity, attributeDefUuid)(record)
    const value = await _adaptValue({ context, record, parentNode: entity, attributeDef, value: valueParam })

    if (!attribute || NodeDef.isMultipleAttribute(attributeDef)) {
      // create new attribute
      const updateResult = new RecordUpdateResult({ record })
      const attributeCreated = Node.newNode(attributeDefUuid, record.uuid, entity, value)
      const attributeToAdd = refData ? NodeRefData.assocRefData(refData)(attributeCreated) : attributeCreated
      updateResult.addNode(attributeToAdd, { sideEffect })
      return updateResult
    }
    return updateAttributeValue({
      survey,
      record,
      entity,
      attributeDef,
      attribute,
      value,
      refData,
      sideEffect,
    })
  }

const _addEntityAndKeyValues =
  ({ context, entityDef, parentNode, keyValuesByDefUuid, sideEffect = false }) =>
  async (record) => {
    const { survey } = context
    const updateResult = new RecordUpdateResult({ record })
    const updateResultDescendants = await CoreRecordNodesUpdater.addNodeAndDescendants({
      ...context,
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
    for (const keyDef of keyDefs) {
      const keyValue = keyValuesByDefUuid[NodeDef.getUuid(keyDef)]

      if (Objects.isEmpty(keyValue)) {
        throw new SystemError('validationErrors:record.entityKeyValueNotSpecified', {
          keyDefName: NodeDef.getName(keyDef),
        })
      }

      const keyAttributeUpdateResult = /* NOSONAR */ await _addOrUpdateAttribute({
        context,
        entity,
        attributeDef: keyDef,
        value: keyValue,
        sideEffect,
      })(updateResult.record)

      if (keyAttributeUpdateResult) {
        updateResult.merge(keyAttributeUpdateResult)
      }
    }
    return { entity, updateResult }
  }

const _getOrCreateEntityByKeys =
  ({ context, entityDefUuid, valuesByDefUuid, insertMissingNodes, sideEffect = false, entityKeysIndexCache = null }) =>
  async (record) => {
    const { survey } = context
    if (NodeDef.getUuid(Survey.getNodeDefRoot(survey)) === entityDefUuid) {
      return { entity: RecordReader.getRootNode(record), updateResult: null }
    }
    const entity = RecordReader.findDescendantByKeyValues({
      survey,
      descendantDefUuid: entityDefUuid,
      keyValuesByDefUuid: valuesByDefUuid,
      entityKeysIndexCache,
    })(record)

    if (entity) {
      return { entity, updateResult: null }
    }
    // entity doesn't exist
    const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)

    if (!insertMissingNodes) {
      const keyValuePairs = getKeyValuePairs({ survey, entityDef, valuesByDefUuid })
      throw new SystemError('appErrors:record.entityNotFound', {
        entityName: NodeDef.getName(entityDef),
        keyValues: keyValuePairs,
      })
    }
    // insert missing entity node (with keys)
    const entityParentDef = Survey.getNodeDefParent(entityDef)(survey)
    const entityParent = NodeDef.isRoot(entityParentDef)
      ? RecordReader.getRootNode(record)
      : RecordReader.findDescendantByKeyValues({
          survey,
          descendantDefUuid: NodeDef.getUuid(entityParentDef),
          keyValuesByDefUuid: valuesByDefUuid,
          entityKeysIndexCache,
        })(record)

    if (!entityParent) {
      const keyValuePairs = getKeyValuePairs({ survey, entityDef: entityParentDef, valuesByDefUuid })
      throw new SystemError('validationErrors:record.missingAncestorForEntity', {
        entityName: NodeDef.getName(entityDef),
        ancestorName: NodeDef.getName(entityParentDef),
        keyValues: keyValuePairs,
      })
    }
    const { entity: entityInserted, updateResult } = await _addEntityAndKeyValues({
      context,
      entityDef,
      parentNode: entityParent,
      keyValuesByDefUuid: valuesByDefUuid,
      sideEffect,
    })(record)

    entityKeysIndexCache?.addEntity({
      parentNode: entityParent,
      entity: entityInserted,
      getKeyAttribute: (entity, keyDefUuid) =>
        RecordReader.getNodeChildByDefUuid(entity, keyDefUuid)(updateResult.record),
    })

    return { entity: entityInserted, updateResult }
  }

/**
 * Finds the entity with the specified key values, inserting it (and its keys) if missing and insertMissingNodes is true.
 * @param {!object} params - The RecordEvaluationContext params, plus the following ones.
 * @param {!string} params.entityDefUuid - The UUID of the entity definition.
 * @param {!object} params.valuesByDefUuid - The values (including the key values) indexed by attribute definition UUID.
 * @param {boolean} [params.insertMissingNodes] - Whether to insert the entity when not found.
 * @param {boolean} [params.sideEffect] - Whether to update the record and the nodes in place.
 * @param {boolean} [params.updateDependents] - Whether to update the dependent nodes of the inserted ones.
 * @param {object} [params.entityKeysIndexCache] - Cache of the entities indexed by key values.
 * @returns {function(object): Promise<object>} - Function taking the record and returning the entity and the update result.
 */
const getOrCreateEntityByKeys =
  ({
    entityDefUuid,
    valuesByDefUuid,
    insertMissingNodes = false,
    sideEffect = false,
    updateDependents = true,
    entityKeysIndexCache = null,
    ...otherParams
  }) =>
  async (record) => {
    const context = RecordEvaluationContext.extract(otherParams)
    const updateResult = new RecordUpdateResult({ record })

    const { entity, updateResult: updateResultEntity } = await _getOrCreateEntityByKeys({
      context,
      entityDefUuid,
      valuesByDefUuid,
      insertMissingNodes,
      sideEffect,
      entityKeysIndexCache,
    })(record)

    if (updateResultEntity) {
      updateResult.merge(updateResultEntity)

      if (!updateDependents) {
        // caller is responsible for updating dependent nodes and validation (see afterNodesUpdate)
        return { entity, updateResult }
      }
      const dependentsUpdateResult = await afterNodesUpdate({
        ...context,
        record: updateResultEntity.record,
        nodes: updateResultEntity.nodes,
        sideEffect,
      })
      updateResult.merge(dependentsUpdateResult)
    }
    return { entity, updateResult }
  }

const _canAttributeBeUpdated = ({ entityDef, attributeDef }) =>
  // consider only attributes descendants of the specified entity
  NodeDef.isDescendantOf(entityDef)(attributeDef) &&
  (NodeDef.isRoot(entityDef) || !NodeDef.isKey(attributeDef)) &&
  // update also read-only values with value evaluated only one time with external data (e.g. from CSV)
  (!NodeDef.isReadOnly(attributeDef) || NodeDef.isDefaultValueEvaluatedOneTime(attributeDef))

/**
 * Updates the attributes descendants of the specified entity with the specified values.
 * @param {!object} params - The RecordEvaluationContext params, plus the following ones.
 * @param {!object} params.entity - The entity whose descendant attributes will be updated.
 * @param {!object} params.valuesByDefUuid - The values indexed by attribute definition UUID.
 * @param {object} [params.refDataByDefUuid] - The ref data of the values indexed by attribute definition UUID.
 * @param {boolean} [params.sideEffect] - Whether to update the record and the nodes in place.
 * @param {boolean} [params.updateDependents] - Whether to update the dependent nodes of the updated ones.
 * @returns {function(object): Promise<object>} - Function taking the record and returning the update result.
 */
const updateAttributesInEntityWithValues =
  ({ entity, valuesByDefUuid, refDataByDefUuid = null, sideEffect = false, updateDependents = true, ...otherParams }) =>
  async (record) => {
    const context = RecordEvaluationContext.extract(otherParams)
    const { survey } = context
    const updateResult = new RecordUpdateResult({ record })

    const updateDependentNodes = async (nodeUpdateResult) => {
      if (!nodeUpdateResult) return

      updateResult.merge(nodeUpdateResult)

      // when not updating dependents, the caller is responsible for it (see afterNodesUpdate)
      if (!updateDependents) return

      const dependentsUpdateResult = await afterNodesUpdate({
        ...context,
        record: nodeUpdateResult.record,
        nodes: nodeUpdateResult.nodes,
        sideEffect,
      })
      updateResult.merge(dependentsUpdateResult)
    }

    const entityDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(entity))(survey)

    for (const [attributeDefUuid, value] of Object.entries(valuesByDefUuid)) {
      const attributeDef = Survey.getNodeDefByUuid(attributeDefUuid)(survey)
      if (_canAttributeBeUpdated({ entityDef, attributeDef })) {
        const { record: currentRecord } = updateResult

        const attributeParentEntity = RecordReader.getNodeParentInDescendantSingleEntities({
          survey,
          parentNode: entity,
          nodeDefUuid: attributeDefUuid,
        })(currentRecord)

        const refData = refDataByDefUuid?.[attributeDefUuid] ?? null

        const attributeUpdateResult = /* NOSONAR */ await _addOrUpdateAttribute({
          context,
          entity: attributeParentEntity,
          attributeDef,
          value,
          refData,
          sideEffect,
        })(currentRecord)

        await updateDependentNodes(attributeUpdateResult) // NOSONAR
      }
    }
    return updateResult
  }

/**
 * Updates the attributes descendants of the entity with the specified key values, inserting it if missing and
 * insertMissingNodes is true.
 * @param {!object} params - The RecordEvaluationContext params, plus the following ones.
 * @param {!string} params.entityDefUuid - The UUID of the entity definition.
 * @param {!object} params.valuesByDefUuid - The values (including the key values) indexed by attribute definition UUID.
 * @param {boolean} [params.insertMissingNodes] - Whether to insert the entity when not found.
 * @param {boolean} [params.sideEffect] - Whether to update the record and the nodes in place.
 * @returns {function(object): Promise<object>} - Function taking the record and returning the update result.
 */
const updateAttributesWithValues =
  ({ entityDefUuid, valuesByDefUuid, insertMissingNodes = false, sideEffect = false, ...otherParams }) =>
  async (record) => {
    const context = RecordEvaluationContext.extract(otherParams)
    const updateResult = new RecordUpdateResult({ record })

    // 1. get or create context entity
    const { entity, updateResult: updateResultEntity } = await getOrCreateEntityByKeys({
      ...context,
      entityDefUuid,
      valuesByDefUuid,
      insertMissingNodes,
      sideEffect,
    })(record)

    updateResult.merge(updateResultEntity)

    // 2. update values in descendant attributes
    const updateResultAttributes = await updateAttributesInEntityWithValues({
      ...context,
      entity,
      valuesByDefUuid,
      sideEffect,
    })(updateResult.record)

    updateResult.merge(updateResultAttributes)

    return updateResult
  }

/**
 * Deletes the nodes of the specified definitions children of the specified entity.
 * @param {!object} params - The RecordEvaluationContext params, plus the following ones.
 * @param {!object} params.entity - The parent entity of the nodes to delete.
 * @param {!string[]} params.nodeDefUuids - The UUIDs of the definitions of the nodes to delete.
 * @param {boolean} [params.sideEffect] - Whether to update the record and the nodes in place.
 * @returns {function(object): Promise<object>} - Function taking the record and returning the update result.
 */
const deleteNodesInEntityByNodeDefUuid =
  ({ entity, nodeDefUuids, sideEffect = false, ...otherParams }) =>
  async (record) => {
    const context = RecordEvaluationContext.extract(otherParams)
    const updateResult = new RecordUpdateResult({ record })

    const nodeUuidsToDelete = []
    for (const nodeDefUuid of nodeDefUuids) {
      const children = RecordReader.getNodeChildrenByDefUuid(entity, nodeDefUuid)(record)
      nodeUuidsToDelete.push(...children.map(Node.getUuid))
    }

    const nodesDeleteUpdateResult = await deleteNodes({
      ...context,
      record,
      nodeUuids: nodeUuidsToDelete,
      sideEffect,
    })
    return updateResult.merge(nodesDeleteUpdateResult)
  }

export const RecordNodesUpdater = {
  afterNodesUpdate,
  createRootEntity,
  getOrCreateEntityByKeys,
  updateNodesDependents,
  updateAttributesInEntityWithValues,
  updateAttributesWithValues,
  deleteNodes,
  deleteNodesInEntityByNodeDefUuid,
}
