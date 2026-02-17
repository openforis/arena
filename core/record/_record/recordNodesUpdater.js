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
      throw new SystemError('validationErrors.dataImport.invalidCode', {
        attributeName,
        code: NodeValues.getValueCode(value),
      })
    }
    return Node.newNodeValueCode({ itemUuid })
  },
}

const _adaptValue = async ({
  survey,
  categoryItemProvider,
  taxonProvider,
  record,
  parentNode,
  attributeDef,
  value,
}) => {
  const valueAdapter = _valueAdapterByType[NodeDef.getType(attributeDef)]
  return valueAdapter
    ? valueAdapter({ survey, categoryItemProvider, taxonProvider, record, parentNode, attributeDef, value })
    : value
}

const _addOrUpdateAttribute =
  ({ survey, categoryItemProvider, taxonProvider, entity, attributeDef, value: valueParam, sideEffect = false }) =>
  async (record) => {
    const attributeDefUuid = NodeDef.getUuid(attributeDef)
    const attribute = RecordReader.getNodeChildByDefUuid(entity, attributeDefUuid)(record)
    const value = await _adaptValue({
      survey,
      categoryItemProvider,
      taxonProvider,
      record,
      parentNode: entity,
      attributeDef,
      value: valueParam,
    })

    if (!attribute || NodeDef.isMultipleAttribute(attributeDef)) {
      // create new attribute
      const updateResult = new RecordUpdateResult({ record })
      const attributeCreated = Node.newNode({ record, nodeDefUuid: attributeDefUuid, parentNode: entity, value })
      updateResult.addNode(attributeCreated, { sideEffect })
      return updateResult
    }
    return updateAttributeValue({ survey, record, entity, attributeDef, attribute, value, sideEffect })
  }

const _addEntityAndKeyValues =
  ({
    user,
    survey,
    categoryItemProvider,
    taxonProvider,
    entityDef,
    parentNode,
    keyValuesByDefUuid,
    sideEffect = false,
  }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })
    const updateResultDescendants = await CoreRecordNodesUpdater.createNodeAndDescendants({
      user,
      survey,
      categoryItemProvider,
      taxonProvider,
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
        throw new SystemError('validationErrors.record.entityKeyValueNotSpecified', {
          keyDefName: NodeDef.getName(keyDef),
        })
      }

      const keyAttributeUpdateResult = await _addOrUpdateAttribute({
        survey,
        categoryItemProvider,
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
  ({
    user,
    survey,
    categoryItemProvider,
    taxonProvider,
    entityDefUuid,
    valuesByDefUuid,
    insertMissingNodes,
    sideEffect = false,
  }) =>
  async (record) => {
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
        })(record)

    if (!entityParent) {
      const keyValuePairs = getKeyValuePairs({ survey, entityDef: entityParentDef, valuesByDefUuid })
      throw new SystemError('validationErrors.record.missingAncestorForEntity', {
        entityName: NodeDef.getName(entityDef),
        ancestorName: NodeDef.getName(entityParentDef),
        keyValues: keyValuePairs,
      })
    }
    const { entity: entityInserted, updateResult } = await _addEntityAndKeyValues({
      user,
      survey,
      categoryItemProvider,
      taxonProvider,
      entityDef,
      parentNode: entityParent,
      keyValuesByDefUuid: valuesByDefUuid,
      sideEffect,
    })(record)

    return { entity: entityInserted, updateResult }
  }

const getOrCreateEntityByKeys =
  ({
    user,
    survey,
    entityDefUuid,
    valuesByDefUuid,
    categoryItemProvider,
    taxonProvider,
    timezoneOffset,
    insertMissingNodes = false,
    sideEffect = false,
  }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    const { entity, updateResult: updateResultEntity } = await _getOrCreateEntityByKeys({
      user,
      survey,
      categoryItemProvider,
      taxonProvider,
      entityDefUuid,
      valuesByDefUuid,
      insertMissingNodes,
      sideEffect,
    })(record)

    if (updateResultEntity) {
      updateResult.merge(updateResultEntity)

      const dependentsUpdateResult = await afterNodesUpdate({
        user,
        survey,
        record: updateResultEntity.record,
        nodes: updateResultEntity.nodes,
        categoryItemProvider,
        taxonProvider,
        timezoneOffset,
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

const updateAttributesInEntityWithValues =
  ({
    user,
    survey,
    entity,
    valuesByDefUuid,
    categoryItemProvider,
    taxonProvider,
    timezoneOffset,
    sideEffect = false,
  }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    const updateDependentNodes = async (nodeUpdateResult) => {
      if (!nodeUpdateResult) return

      updateResult.merge(nodeUpdateResult)

      const dependentsUpdateResult = await afterNodesUpdate({
        user,
        survey,
        record: nodeUpdateResult.record,
        nodes: nodeUpdateResult.nodes,
        categoryItemProvider,
        taxonProvider,
        timezoneOffset,
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

        const attributeUpdateResult = await _addOrUpdateAttribute({
          survey,
          categoryItemProvider,
          taxonProvider,
          entity: attributeParentEntity,
          attributeDef,
          value,
          sideEffect,
        })(currentRecord)

        await updateDependentNodes(attributeUpdateResult)
      }
    }
    return updateResult
  }

const updateAttributesWithValues =
  ({
    user,
    survey,
    entityDefUuid,
    valuesByDefUuid,
    categoryItemProvider,
    taxonProvider,
    timezoneOffset,
    insertMissingNodes = false,
    sideEffect = false,
  }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    // 1. get or create context entity
    const { entity, updateResult: updateResultEntity } = await getOrCreateEntityByKeys({
      user,
      survey,
      entityDefUuid,
      valuesByDefUuid,
      categoryItemProvider,
      taxonProvider,
      timezoneOffset,
      insertMissingNodes,
      sideEffect,
    })(record)

    updateResult.merge(updateResultEntity)

    // 2. update values in descendant attributes
    const updateResultAttributes = await updateAttributesInEntityWithValues({
      survey,
      entity,
      valuesByDefUuid,
      categoryItemProvider,
      taxonProvider,
      timezoneOffset,
      sideEffect,
    })(updateResult.record)

    updateResult.merge(updateResultAttributes)

    return updateResult
  }

const deleteNodesInEntityByNodeDefUuid =
  ({ user, survey, entity, nodeDefUuids, categoryItemProvider, taxonProvider, sideEffect = false }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    const nodeIIdsToDelete = []
    for (const nodeDefUuid of nodeDefUuids) {
      const children = RecordReader.getNodeChildrenByDefUuid(entity, nodeDefUuid)(record)
      nodeIIdsToDelete.push(...children.map(Node.getIId))
    }

    const nodesDeleteUpdateResult = await deleteNodes({
      user,
      survey,
      record,
      nodeInternalIds: nodeIIdsToDelete,
      categoryItemProvider,
      taxonProvider,
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
