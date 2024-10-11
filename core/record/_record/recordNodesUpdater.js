import {
  Objects,
  RecordUpdater as CoreRecordUpdater,
  RecordNodesUpdater as CoreRecordNodesUpdater,
  RecordUpdateResult,
} from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import SystemError from '@core/systemError'

import * as RecordReader from './recordReader'
import { NodeValueFormatter } from '../nodeValueFormatter'
import { updateAttributeValue } from './recordNodeValueUpdater'

const { createNodeAndDescendants, createRootEntity, deleteNodes } = CoreRecordUpdater
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
      const attributeName = NodeDef.getName(attributeDef)
      throw new SystemError('validationErrors.dataImport.invalidCode', { attributeName, code })
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

    if (!attribute || NodeDef.isMultipleAttribute(attributeDef)) {
      // create new attribute
      const updateResult = new RecordUpdateResult({ record })
      const attributeCreated = Node.newNode(attributeDefUuid, record.uuid, entity, value)
      updateResult.addNode(attributeCreated, { sideEffect })
      return updateResult
    }
    return updateAttributeValue({ survey, record, entity, attributeDef, attribute, value, sideEffect })
  }

const _addEntityAndKeyValues =
  ({ user, survey, entityDef, parentNode, keyValuesByDefUuid, sideEffect = false }) =>
  (record) => {
    const updateResult = new RecordUpdateResult({ record })
    const updateResultDescendants = CoreRecordNodesUpdater.createNodeAndDescendants({
      user,
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
        throw new SystemError('validationErrors.record.entityKeyValueNotSpecified', {
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
  ({ user, survey, entityDefUuid, valuesByDefUuid, insertMissingNodes, sideEffect = false }) =>
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
    const { entity: entityInserted, updateResult } = _addEntityAndKeyValues({
      user,
      survey,
      entityDef,
      parentNode: entityParent,
      keyValuesByDefUuid: valuesByDefUuid,
      sideEffect,
    })(record)

    return { entity: entityInserted, updateResult }
  }

const getOrCreateEntityByKeys =
  ({ user, survey, entityDefUuid, valuesByDefUuid, timezoneOffset, insertMissingNodes = false, sideEffect = false }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    const { entity, updateResult: updateResultEntity } = _getOrCreateEntityByKeys({
      user,
      survey,
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
        timezoneOffset,
        sideEffect,
      })
      updateResult.merge(dependentsUpdateResult)
    }
    return { entity, updateResult }
  }

const updateAttributesInEntityWithValues =
  ({ user, survey, entity, valuesByDefUuid, timezoneOffset, sideEffect = false }) =>
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
        timezoneOffset,
        sideEffect,
      })
      updateResult.merge(dependentsUpdateResult)
    }

    const entityDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(entity))(survey)

    // consider only attributes descendants of the specified entity

    const valuesByDefUuidEntriesInDescendantAttributes = Object.entries(valuesByDefUuid).filter(
      ([attributeDefUuid]) => {
        const attributeDef = Survey.getNodeDefByUuid(attributeDefUuid)(survey)
        return (
          NodeDef.isDescendantOf(entityDef)(attributeDef) &&
          (NodeDef.isRoot(entityDef) || !NodeDef.isKey(attributeDef)) &&
          // update also read-only values with value evaluated only one time with external data (e.g. from CSV)
          (!NodeDef.isReadOnly(attributeDef) || NodeDef.isDefaultValueEvaluatedOneTime(attributeDef))
        )
      }
    )

    // update attribute values
    for await (const [attributeDefUuid, value] of valuesByDefUuidEntriesInDescendantAttributes) {
      const attributeDef = Survey.getNodeDefByUuid(attributeDefUuid)(survey)

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

      await updateDependentNodes(attributeUpdateResult)
    }
    return updateResult
  }

const updateAttributesWithValues =
  ({ user, survey, entityDefUuid, valuesByDefUuid, timezoneOffset, insertMissingNodes = false, sideEffect = false }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    // 1. get or create context entity
    const { entity, updateResult: updateResultEntity } = await getOrCreateEntityByKeys({
      user,
      survey,
      entityDefUuid,
      valuesByDefUuid,
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
      timezoneOffset,
      sideEffect,
    })(updateResult.record)

    updateResult.merge(updateResultAttributes)

    return updateResult
  }

const deleteNodesInEntityByNodeDefUuid =
  ({ user, survey, entity, nodeDefUuids, sideEffect = false }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    const nodeUuidsToDelete = []
    nodeDefUuids.forEach((nodeDefUuid) => {
      const children = RecordReader.getNodeChildrenByDefUuid(entity, nodeDefUuid)(record)
      nodeUuidsToDelete.push(...children.map(Node.getUuid))
    })

    const nodesDeleteUpdateResult = await deleteNodes({
      user,
      survey,
      record,
      nodeUuids: nodeUuidsToDelete,
      sideEffect,
    })
    return updateResult.merge(nodesDeleteUpdateResult)
  }

export const RecordNodesUpdater = {
  afterNodesUpdate,
  createNodeAndDescendants,
  createRootEntity,
  getOrCreateEntityByKeys,
  updateNodesDependents,
  updateAttributesInEntityWithValues,
  updateAttributesWithValues,
  deleteNodesInEntityByNodeDefUuid,
}
