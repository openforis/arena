import * as A from '@core/arena'
import Queue from '@core/queue'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Node from '@core/record/node'
import * as RecordValidator from '@core/record/recordValidator'
import * as Validation from '@core/validation/validation'

import { NodeValues } from '../nodeValues'
import * as RecordReader from './recordReader'
import * as RecordNodeDependentsUpdater from './recordNodeDependentsUpdater'
import RecordUpdateResult from './RecordUpdateResult'

/**
 * Nodes can be visited maximum 2 times during the update of the dependent nodes, to avoid loops in the evaluation.
 * The first time the applicability can depend on attributes with default values not applied yet.
 * The second time the applicability expression can be evaluated correctly.
 */
const MAX_DEPENDENTS_VISITING_TIMES = 2

const getNodesToInsertCount = (nodeDef) => {
  if (NodeDef.isSingle(nodeDef)) return 1
  const validations = NodeDef.getValidations(nodeDef)
  return Number(NodeDefValidations.getMinCount(validations)) || 0
}

const _addNodeAndDescendants = ({ survey, record, parentNode, nodeDef }) => {
  const node = Node.newNode(NodeDef.getUuid(nodeDef), record.uuid, parentNode)

  const updateResult = new RecordUpdateResult({ record })
  updateResult.addNode(node)

  // Add children if entity
  if (NodeDef.isEntity(nodeDef)) {
    const childDefs = Survey.getNodeDefChildren(nodeDef)(survey)

    // Add only child single nodes (it allows to apply default values)
    childDefs.forEach((childDef) => {
      const nodesToInsert = getNodesToInsertCount(childDef)
      if (nodesToInsert === 0) {
        return // do nothing
      }
      const nodesToInsertArray = [...Array(Number(nodesToInsert)).keys()]
      nodesToInsertArray.forEach(() => {
        const childUpdateResult = _addNodeAndDescendants({
          survey,
          record: updateResult.record,
          parentNode: node,
          nodeDef: childDef,
        })
        updateResult.merge(childUpdateResult)
      })
    })
  }
  return updateResult
}

const updateNodesDependents = ({ survey, record, nodes, logger = null }) => {
  // Output
  const updateResult = new RecordUpdateResult({ record, nodes })

  const nodesToVisit = new Queue(Object.values(nodes))

  const visitedCountByUuid = {} // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)

  while (!nodesToVisit.isEmpty()) {
    const node = nodesToVisit.dequeue()

    const nodeUuid = Node.getUuid(node)

    const visitedCount = visitedCountByUuid[nodeUuid] || 0

    if (visitedCount < MAX_DEPENDENTS_VISITING_TIMES) {
      // Update node dependents (applicability)
      const applicabilityUpdateResult = RecordNodeDependentsUpdater.updateSelfAndDependentsApplicable({
        survey,
        record: updateResult.record,
        node,
        logger,
      })

      updateResult.merge(applicabilityUpdateResult)

      // Update node dependents (default values)
      const defaultValuesUpdateResult = RecordNodeDependentsUpdater.updateSelfAndDependentsDefaultValues({
        survey,
        record: updateResult.record,
        node,
        logger,
      })

      updateResult.merge(defaultValuesUpdateResult)

      // Update record nodes
      const nodesUpdatedCurrent = {
        ...applicabilityUpdateResult.nodes,
        ...defaultValuesUpdateResult.nodes,
      }

      // Mark updated nodes to visit
      nodesToVisit.enqueueItems(Object.values(nodesUpdatedCurrent))

      // Mark node visited
      visitedCountByUuid[nodeUuid] = visitedCount + 1
    }
  }

  return updateResult
}

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
    const updateResultDescendants = _addNodeAndDescendants({
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

const _afterNodesUpdate = async ({ survey, record, nodes, logger }) => {
  // output
  const updateResult = new RecordUpdateResult({ record, nodes })

  // 1. update dependent nodes
  const updateResultDependents = updateNodesDependents({
    survey,
    record,
    nodes,
    logger,
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
  ({ survey, entityDefUuid, valuesByDefUuid, insertMissingNodes = false, logger = null }) =>
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
        })(record)
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

    return _afterNodesUpdate({ survey, record: updateResult.record, nodes: updateResult.nodes, logger })
  }

export const RecordNodesUpdater = {
  updateNodesDependents,
  updateAttributesWithValues,
}
