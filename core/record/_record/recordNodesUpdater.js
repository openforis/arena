import {
  Dates,
  Objects,
  Records,
  RecordUpdater as CoreRecordUpdater,
  RecordNodesUpdater as CoreRecordNodesUpdater,
  RecordValidator,
  RecordUpdateResult,
  Promises,
  Surveys,
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

const { createNodeAndDescendants, createRootEntity, deleteNodes } = CoreRecordUpdater
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

const _updateAttributeValue = ({
  survey,
  record,
  entity,
  attributeDef,
  attribute,
  value,
  dateModified: dataModifiedParam = null,
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
    }) ||
    dataModifiedParam // always update attribute when dateModified changes
  ) {
    // update existing attribute (if value changed);
    // do not update meta defaultValue applied flag (value could have been a default value already)
    const attributeUpdated = A.pipe(
      Node.assocValue(value),
      Node.assocUpdated(true),
      Node.assocDateModified(dataModifiedParam ?? new Date())
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

    if (!attribute || NodeDef.isMultipleAttribute(attributeDef)) {
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
      throw new SystemError('validationErrors.record.missingAncestorForEntity', {
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

const _afterNodesUpdate = async ({ survey, record, nodes, timezoneOffset, sideEffect = false }) => {
  // output
  const updateResult = new RecordUpdateResult({ record, nodes })

  // 1. update dependent nodes
  const updateResultDependents = updateNodesDependents({
    survey,
    record,
    nodes,
    timezoneOffset,
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

const getOrCreateEntityByKeys =
  ({ survey, entityDefUuid, valuesByDefUuid, timezoneOffset, insertMissingNodes = false, sideEffect = false }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    const { entity, updateResult: updateResultEntity } = _getOrCreateEntityByKeys({
      survey,
      entityDefUuid,
      valuesByDefUuid,
      insertMissingNodes,
      sideEffect,
    })(record)

    if (updateResultEntity) {
      updateResult.merge(updateResultEntity)

      const dependentsUpdateResult = await _afterNodesUpdate({
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
  ({ survey, entity, valuesByDefUuid, timezoneOffset, sideEffect = false }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    const updateDependentNodes = async (nodeUpdateResult) => {
      if (!nodeUpdateResult) return

      updateResult.merge(nodeUpdateResult)

      const dependentsUpdateResult = await _afterNodesUpdate({
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
    await Promises.each(valuesByDefUuidEntriesInDescendantAttributes, async ([attributeDefUuid, value]) => {
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
    })
    return updateResult
  }

const updateAttributesWithValues =
  ({ survey, entityDefUuid, valuesByDefUuid, timezoneOffset, insertMissingNodes = false, sideEffect = false }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    // 1. get or create context entity
    const { entity, updateResult: updateResultEntity } = await getOrCreateEntityByKeys({
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
    const attributeUpdateResult = _updateAttributeValue({
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

const replaceUpdatedNodes =
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
    return _afterNodesUpdate({
      survey,
      record: updateResult.record,
      nodes: updateResult.nodes,
      timezoneOffset,
      sideEffect,
    })
  }

const findEntityByUuidOrKeys = ({ survey, record, entityDefUuid, parentEntity, uuid, keyValuesByDefUuid }) => {
  const entityWithSameUuid = Records.getNodeByUuid(uuid)(record)
  return (
    entityWithSameUuid ??
    Records.findEntityByKeyValues({ survey, record, parentEntity, entityDefUuid, keyValuesByDefUuid })
  )
}

const mergeRecords =
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
        const childDefUuid = NodeDef.getUuid(childDef)
        const childrenSource = RecordReader.findNodeChildren(entitySource, childDefUuid)(recordSource)
        const childrenTarget = RecordReader.findNodeChildren(entityTarget, childDefUuid)(recordTarget)
        if (NodeDef.isSingle(childDef)) {
          const childSource = childrenSource[0]
          const childTarget = childrenTarget[0]
          if (childSource && childTarget) {
            if (NodeDef.isAttribute(childDef)) {
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
              stack.push({ entitySource: childSource, entityTarget: childTarget })
            }
          }
        } else if (NodeDef.isEntity(childDef)) {
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
              stack.push({ entitySource: childSource, entityTarget: childTarget })
            } else {
              // TODO add childSource entity and descendants to targetRecord
              RecordReader.visitDescendantsAndSelf(childSource, (visitedChildSource) => {
                const newNodeToAdd = Node.assocCreated(true)(visitedChildSource) // new node for the server
                delete newNodeToAdd[Node.keys.id] // clear internal id
                newNodeToAdd[Node.keys.recordUuid] = recordTarget.uuid
                if (visitedChildSource === childSource) {
                  newNodeToAdd[Node.keys.parentUuid] = Node.getUuid(entityTarget)
                }
                updateResult.addNode(newNodeToAdd)
              })(recordSource)
            }
          })
        } else {
          // TODO support multiple attributes merge
        }
      })
    }
    return _afterNodesUpdate({
      survey,
      record: updateResult.record,
      nodes: updateResult.nodes,
      timezoneOffset,
      sideEffect,
    })
  }

const deleteNodesInEntityByNodeDefUuid =
  ({ survey, entity, nodeDefUuids, sideEffect = false }) =>
  async (record) => {
    const updateResult = new RecordUpdateResult({ record })

    const nodeUudisToDelete = []
    nodeDefUuids.forEach((nodeDefUuid) => {
      const children = RecordReader.getNodeChildrenByDefUuid(entity, nodeDefUuid)(record)
      nodeUudisToDelete.push(...children.map(Node.getUuid))
    })

    const nodesDeleteUpdateResult = await deleteNodes({ survey, record, nodeUuids: nodeUudisToDelete, sideEffect })
    return updateResult.merge(nodesDeleteUpdateResult)
  }

export const RecordNodesUpdater = {
  createNodeAndDescendants,
  createRootEntity,
  getOrCreateEntityByKeys,
  updateNodesDependents,
  updateAttributesInEntityWithValues,
  updateAttributesWithValues,
  replaceUpdatedNodes,
  mergeRecords,
  deleteNodesInEntityByNodeDefUuid,
}
