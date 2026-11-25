import {
  ArenaAnyNodeDef,
  type ArenaCategoryItemProvider,
  type ArenaNodeDefEntity,
  type ArenaRecord,
  type ArenaRecordNode,
  type ArenaRecordNodeRefData,
  type ArenaSurvey,
  Objects,
  RecordNodesUpdater as CoreRecordNodesUpdater,
  RecordNodeValues,
  RecordUpdater as CoreRecordUpdater,
  RecordUpdateResult,
} from '@openforis/arena-core'

import * as Node from '@core/record/node'
import * as CategoryItem from '@core/survey/categoryItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import SystemError from '@core/systemError'
import * as NodeRefData from '../nodeRefData'
import { NodeValueFormatter } from '../nodeValueFormatter'
import { RecordEvaluationContext } from '../recordEvaluationContext'

import { updateAttributeValue } from './recordNodeValueUpdater'
import * as RecordReader from './recordReader'

const { createRootEntity, deleteNodes } = CoreRecordUpdater
const { updateNodesDependents } = CoreRecordNodesUpdater

import type { EntityKeysIndexCache } from './entityKeysIndexCache'
import { afterNodesUpdate } from './recordNodesUpdaterCommon'

type ValuesByDefUuid = Record<string, any>
// RecordEvaluationContext params, forwarded to arena-core
type ContextParams = { [contextParam: string]: unknown }
type EntityAndUpdateResult = { entity: ArenaRecordNode; updateResult: RecordUpdateResult | null }

const getKeyValuePairs = ({
  survey,
  entityDef,
  valuesByDefUuid,
}: {
  survey: ArenaSurvey
  entityDef: ArenaNodeDefEntity
  valuesByDefUuid: ValuesByDefUuid
}): string => {
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

// the provider (optional in the evaluation context) is used only for items not found in the survey ref data
type CategoryItemProviderParams = { survey: ArenaSurvey; categoryItemProvider?: ArenaCategoryItemProvider }

const _getOrFetchCategoryItem = async ({
  survey,
  categoryItemProvider,
  attribute,
}: CategoryItemProviderParams & { attribute: ArenaRecordNode }) => {
  const refDataItem = NodeRefData.getCategoryItem(attribute)
  if (refDataItem) {
    return refDataItem
  }
  const value = Node.getValue(attribute)
  const itemUuid = RecordNodeValues.getValueItemUuid(value)
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
  const item = await categoryItemProvider.getItemByUuid({ survey, categoryUuid, itemUuid })
  return item
}

const _getCodeAttributeCode = async ({
  survey,
  categoryItemProvider,
  attribute,
}: CategoryItemProviderParams & { attribute: ArenaRecordNode }): Promise<string | null> => {
  const value = Node.getValue(attribute)
  const code = RecordNodeValues.getValueCode(value)
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
}: CategoryItemProviderParams & {
  record: ArenaRecord
  parentNode: ArenaRecordNode
  attributeDef: ArenaAnyNodeDef
  value: any
}): Promise<string | null> => {
  const valueItemUuid = RecordNodeValues.getValueItemUuid(value)
  if (valueItemUuid) {
    return valueItemUuid
  }
  const code = RecordNodeValues.getValueCode(value)
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
  if (ancestorCodes.some((ancestorCode) => Objects.isEmpty(ancestorCode))) {
    return null
  }
  const codePaths = [...ancestorCodes, code]
  const item = await categoryItemProvider.getItemByCodePaths({ survey, categoryUuid, codePaths })
  return item ? item.uuid : null
}

type ValueAdapter = (params: CategoryItemProviderParams & Omit<AttributeValueParams, 'context'>) => Promise<any>

const _valueAdapterByType: Record<string, ValueAdapter> = {
  [NodeDef.nodeDefType.code]: async ({ survey, categoryItemProvider, record, parentNode, attributeDef, value }) => {
    if (RecordNodeValues.getValueItemUuid(value)) {
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
        code: RecordNodeValues.getValueCode(value),
      })
    }
    return Node.newNodeValueCode({ itemUuid })
  },
}

// params (context) are the ones of RecordEvaluationContext: providers are taken from there
type AttributeValueParams = {
  context: RecordEvaluationContext
  record: ArenaRecord
  parentNode: ArenaRecordNode
  attributeDef: ArenaAnyNodeDef
  value: any
}

const _adaptValue = async ({ context, record, parentNode, attributeDef, value }: AttributeValueParams) => {
  const valueAdapter = _valueAdapterByType[NodeDef.getType(attributeDef)]
  if (!valueAdapter) return value
  const valueAdapted = await valueAdapter({ ...context, record, parentNode, attributeDef, value })
  return valueAdapted
}

const _addOrUpdateAttribute =
  ({
    context,
    entity,
    attributeDef,
    value: valueParam,
    refData = null,
    sideEffect = false,
  }: {
    context: RecordEvaluationContext
    entity: ArenaRecordNode
    attributeDef: ArenaAnyNodeDef
    value: any
    refData?: ArenaRecordNodeRefData | null
    sideEffect?: boolean
  }) =>
  async (record: ArenaRecord): Promise<RecordUpdateResult | null> => {
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
  ({
    context,
    entityDef,
    parentNode,
    keyValuesByDefUuid,
    sideEffect = false,
  }: {
    context: RecordEvaluationContext
    entityDef: ArenaNodeDefEntity
    parentNode: ArenaRecordNode
    keyValuesByDefUuid: ValuesByDefUuid
    sideEffect?: boolean
  }) =>
  async (record: ArenaRecord): Promise<EntityAndUpdateResult> => {
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

type GetOrCreateEntityParams = {
  entityDefUuid: string
  valuesByDefUuid: ValuesByDefUuid
  insertMissingNodes?: boolean
  sideEffect?: boolean
  entityKeysIndexCache?: EntityKeysIndexCache | null
}

const _getOrCreateEntityByKeys =
  ({
    context,
    entityDefUuid,
    valuesByDefUuid,
    insertMissingNodes,
    sideEffect = false,
    entityKeysIndexCache = null,
  }: GetOrCreateEntityParams & { context: RecordEvaluationContext }) =>
  async (record: ArenaRecord): Promise<EntityAndUpdateResult> => {
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
    const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey) as ArenaNodeDefEntity

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
 * @param params - The RecordEvaluationContext params, plus the following ones.
 * @param params.entityDefUuid - The UUID of the entity definition.
 * @param params.valuesByDefUuid - The values (including the key values) indexed by attribute definition UUID.
 * @param params.insertMissingNodes - Whether to insert the entity when not found.
 * @param params.sideEffect - Whether to update the record and the nodes in place.
 * @param params.updateDependents - Whether to update the dependent nodes of the inserted ones.
 * @param params.entityKeysIndexCache - Cache of the entities indexed by key values.
 * @returns Function taking the record and returning the entity and the update result.
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
  }: GetOrCreateEntityParams & { updateDependents?: boolean } & ContextParams) =>
  async (record: ArenaRecord): Promise<{ entity: ArenaRecordNode; updateResult: RecordUpdateResult }> => {
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

const _canAttributeBeUpdated = ({
  entityDef,
  attributeDef,
}: {
  entityDef: ArenaNodeDefEntity
  attributeDef: ArenaAnyNodeDef
}) =>
  // consider only attributes descendants of the specified entity
  NodeDef.isDescendantOf(entityDef)(attributeDef) &&
  (NodeDef.isRoot(entityDef) || !NodeDef.isKey(attributeDef)) &&
  // update also read-only values with value evaluated only one time with external data (e.g. from CSV)
  (!NodeDef.isReadOnly(attributeDef) || NodeDef.isDefaultValueEvaluatedOneTime(attributeDef))

/**
 * Updates the attributes descendants of the specified entity with the specified values.
 * @param params - The RecordEvaluationContext params, plus the following ones.
 * @param params.entity - The entity whose descendant attributes will be updated.
 * @param params.valuesByDefUuid - The values indexed by attribute definition UUID.
 * @param params.refDataByDefUuid - The ref data of the values indexed by attribute definition UUID.
 * @param params.sideEffect - Whether to update the record and the nodes in place.
 * @param params.updateDependents - Whether to update the dependent nodes of the updated ones.
 * @returns Function taking the record and returning the update result.
 */
const updateAttributesInEntityWithValues =
  ({
    entity,
    valuesByDefUuid,
    refDataByDefUuid = null,
    sideEffect = false,
    updateDependents = true,
    ...otherParams
  }: {
    entity: ArenaRecordNode
    valuesByDefUuid: ValuesByDefUuid
    refDataByDefUuid?: Record<string, ArenaRecordNodeRefData> | null
    sideEffect?: boolean
    updateDependents?: boolean
  } & ContextParams) =>
  async (record: ArenaRecord): Promise<RecordUpdateResult> => {
    const context = RecordEvaluationContext.extract(otherParams)
    const { survey } = context
    const updateResult = new RecordUpdateResult({ record })

    const updateDependentNodes = async (nodeUpdateResult: RecordUpdateResult | null): Promise<void> => {
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

    const entityDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(entity))(survey) as ArenaNodeDefEntity

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
 * @param params - The RecordEvaluationContext params, plus the following ones.
 * @param params.entityDefUuid - The UUID of the entity definition.
 * @param params.valuesByDefUuid - The values (including the key values) indexed by attribute definition UUID.
 * @param params.insertMissingNodes - Whether to insert the entity when not found.
 * @param params.sideEffect - Whether to update the record and the nodes in place.
 * @returns Function taking the record and returning the update result.
 */
const updateAttributesWithValues =
  ({
    entityDefUuid,
    valuesByDefUuid,
    insertMissingNodes = false,
    sideEffect = false,
    ...otherParams
  }: Omit<GetOrCreateEntityParams, 'entityKeysIndexCache'> & ContextParams) =>
  async (record: ArenaRecord): Promise<RecordUpdateResult> => {
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
 * @param params - The RecordEvaluationContext params, plus the following ones.
 * @param params.entity - The parent entity of the nodes to delete.
 * @param params.nodeDefUuids - The UUIDs of the definitions of the nodes to delete.
 * @param params.sideEffect - Whether to update the record and the nodes in place.
 * @returns Function taking the record and returning the update result.
 */
const deleteNodesInEntityByNodeDefUuid =
  ({
    entity,
    nodeDefUuids,
    sideEffect = false,
    ...otherParams
  }: { entity: ArenaRecordNode; nodeDefUuids: string[]; sideEffect?: boolean } & ContextParams) =>
  async (record: ArenaRecord): Promise<RecordUpdateResult> => {
    const context = RecordEvaluationContext.extract(otherParams)
    const updateResult = new RecordUpdateResult({ record })

    const nodeUuidsToDelete: string[] = []
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
