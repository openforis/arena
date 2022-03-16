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
import * as RecordUpdater from './recordUpdater'
import * as RecordNodeDependentsUpdater from './recordNodeDependentsUpdater'

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

const _addNodeAndDescendants = ({ survey, nodeDef, record, node, updateListener }) => {
  let recordUpdated = RecordUpdater.assocNode(node)(record)

  // Add children if entity
  const childDefs = NodeDef.isEntity(nodeDef) ? Survey.getNodeDefChildren(nodeDef)(survey) : []

  // Insert only child single nodes (it allows to apply default values)
  childDefs.forEach((childDef) => {
    const nodesToInsert = getNodesToInsertCount(childDef)
    if (nodesToInsert === 0) {
      return acc
    }
    const nodesToInsertArray = [...Array(Number(nodesToInsert)).keys()]
    nodesToInsertArray.forEach(() => {
      const childNode = Node.newNode(NodeDef.getUuid(childDef), Node.getRecordUuid(node), node)
      const recordUpdatedChild = _addNodeAndDescendants({
        survey,
        nodeDef: childDef,
        record: recordUpdated,
        node: childNode,
        updateListener,
      })
      recordUpdated = recordUpdatedChild
      updateListener.nodeCreated({ record: recordUpdated, node: childNode })
    })
  })

  return recordUpdated
}

const updateNodesDependents = ({ survey, record, nodes, logger = null }) => {
  // Output
  const nodesUpdated = { ...nodes }
  const nodesUpdatedToPersist = {}
  let recordUpdated = record

  const nodesToVisit = new Queue(Object.values(nodes))

  const visitedCountByUuid = {} // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)

  while (!nodesToVisit.isEmpty()) {
    const node = nodesToVisit.dequeue()

    const nodeUuid = Node.getUuid(node)

    const visitedCount = visitedCountByUuid[nodeUuid] || 0

    if (visitedCount < MAX_DEPENDENTS_VISITING_TIMES) {
      // Update node dependents (applicability)
      const {
        nodesUpdatedToPersist: nodesToPersistApplicability,
        nodesWithApplicabilityUpdated,
        record: recordUpdatedAvailability,
      } = RecordNodeDependentsUpdater.updateSelfAndDependentsApplicable({ survey, record: recordUpdated, node, logger })

      recordUpdated = recordUpdatedAvailability
      Object.assign(nodesUpdatedToPersist, nodesToPersistApplicability)

      // Update node dependents (default values)
      const { nodesUpdated: nodesWithDefaultValueUpdated, record: recordUpdatedDefaultValues } =
        RecordNodeDependentsUpdater.updateSelfAndDependentsDefaultValues({
          survey,
          record: recordUpdated,
          node,
          logger,
        })

      recordUpdated = recordUpdatedDefaultValues
      Object.assign(nodesUpdatedToPersist, nodesWithDefaultValueUpdated)

      // Update record nodes
      const nodesUpdatedCurrent = {
        ...nodesToPersistApplicability,
        ...nodesWithApplicabilityUpdated,
        ...nodesWithDefaultValueUpdated,
      }

      // Mark updated nodes to visit
      nodesToVisit.enqueueItems(Object.values(nodesUpdatedCurrent))

      // Update nodes to return
      Object.assign(nodesUpdated, nodesUpdatedCurrent)

      // Mark node visited
      visitedCountByUuid[nodeUuid] = visitedCount + 1
    }
  }

  recordUpdated = RecordUpdater.mergeNodes(nodesUpdated)(recordUpdated)

  return {
    record: recordUpdated,
    nodesUpdated,
    nodesUpdatedToPersist,
  }
}

const _addOrUpdateAttribute =
  ({ survey, entity, attributeDef, value, updateListener }) =>
  (record) => {
    const attributeDefUuid = NodeDef.getUuid(attributeDef)
    const attribute = RecordReader.getNodeChildByDefUuid(entity, attributeDefUuid)(record)

    if (!attribute) {
      // create new attribute
      const attributeUpdated = Node.newNode(attributeDefUuid, record.uuid, entity, value)
      const recordUpdated = RecordUpdater.assocNode(attributeUpdated)(record)
      updateListener.nodeCreated({ record: recordUpdated, node: attributeUpdated })
      return recordUpdated
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
      const recordUpdated = RecordUpdater.assocNode(attributeUpdated)(record)
      updateListener.nodeUpdated({ record: recordUpdated, node: attributeUpdated })
      return recordUpdated
    }
    // no updates performed
    return record
  }

const _addEntityAndKeyValues =
  ({ survey, entityDef, parentNode, keyValuesByDefUuid, updateListener }) =>
  (record) => {
    const entity = Node.newNode(NodeDef.getUuid(entityDef), record.uuid, parentNode)
    const recordUpdatedDescendants = _addNodeAndDescendants({
      survey,
      nodeDef: entityDef,
      record,
      node: entity,
      updateListener,
    })
    let recordUpdated = recordUpdatedDescendants

    const keyDefs = Survey.getNodeDefKeys(entityDef)(survey)
    keyDefs.forEach((keyDef) => {
      const keyValue = keyValuesByDefUuid[NodeDef.getUuid(keyDef)]
      const recordUpdatedKeyNode = _addOrUpdateAttribute({
        survey,
        entity,
        attributeDef: keyDef,
        value: keyValue,
        updateListener,
      })(recordUpdated)

      recordUpdated = recordUpdatedKeyNode
    })
    return { record: recordUpdated, entity }
  }

const _getOrCreateEntityByKeys =
  ({ survey, entityDefUuid, valuesByDefUuid, insertMissingNodes, updateListener }) =>
  (record) => {
    const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
    const entity = RecordReader.findDescendantByKeyValues({
      survey,
      descendantDefUuid: entityDefUuid,
      keyValuesByDefUuid: valuesByDefUuid,
    })(record)

    if (entity) {
      return { entity, record }
    }
    if (!insertMissingNodes) {
      throw new Error('entity not found')
    }
    // insert entity node (with keys)
    const entityParentDef = Survey.getNodeDefAncestorMultipleEntity(entityDef)(survey)
    const entityParent = RecordReader.findDescendantByKeyValues({
      survey,
      descendantDefUuid: NodeDef.getUuid(entityParentDef),
      keyValuesByDefUuid: valuesByDefUuid,
    })(record)
    if (!entityParent) {
      throw new Error('cannot find ancestor node to create entity into')
    }
    const { entity: entityCreated, record: recordUpdatedEntityInserted } = _addEntityAndKeyValues({
      survey,
      entityDef,
      parentNode: entityParent,
      keyValuesByDefUuid: valuesByDefUuid,
      updateListener,
    })(record)

    return { record: recordUpdatedEntityInserted, entity: entityCreated }
  }

const _afterNodesUpdate = async ({ survey, record, nodes, logger }) => {
  // output
  let recordUpdated
  const nodesUpdated = { ...nodes }

  // 1. update dependent nodes
  const {
    record: recordUpdatedDependents,
    nodesUpdated: nodesUpdatedDependents,
    nodesUpdatedToPersist,
  } = updateNodesDependents({
    survey,
    record,
    nodes,
    logger,
  })
  Object.assign(nodesUpdated, nodesUpdatedDependents)
  recordUpdated = recordUpdatedDependents

  // 2. update node validations
  const nodesValidation = await RecordValidator.validateNodes({
    survey,
    record: recordUpdated,
    nodes: nodesUpdated,
  })
  const recordValidationUpdated = A.pipe(
    Validation.getValidation,
    Validation.mergeValidation(nodesValidation),
    Validation.updateCounts
  )(recordUpdated)
  recordUpdated = Validation.assocValidation(recordValidationUpdated)(recordUpdated)

  return {
    record: recordUpdated,
    nodes: nodesUpdated,
    nodesUpdatedToPersist,
  }
}

const updateAttributesWithValues =
  ({ survey, entityDefUuid, valuesByDefUuid, insertMissingNodes = false, logger = null }) =>
  async (record) => {
    let recordUpdated = { ...record }
    const nodesUpdated = {}

    const updateListener = {
      nodeCreated: ({ node }) => (nodesUpdated[node.uuid] = node),
      nodeUpdated: ({ node }) => (nodesUpdated[node.uuid] = node),
    }

    // 1. get or create context entity
    const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
    const { entity, record: recordUpdatedEntity } = _getOrCreateEntityByKeys({
      survey,
      entityDefUuid,
      valuesByDefUuid,
      insertMissingNodes,
      updateListener,
    })(record)

    recordUpdated = recordUpdatedEntity

    // 2. update attribute values
    Object.entries(valuesByDefUuid).forEach(([attributeDefUuid, value]) => {
      const attributeDef = Survey.getNodeDefByUuid(attributeDefUuid)(survey)
      if (
        NodeDef.isDescendantOf(entityDef)(attributeDef) &&
        !NodeDef.isKey(attributeDef) &&
        !NodeDef.isReadOnly(attributeDef)
      ) {
        recordUpdated = _addOrUpdateAttribute({
          survey,
          entity,
          attributeDef,
          value,
          updateListener,
        })(recordUpdated)
      }
    })

    return _afterNodesUpdate({ survey, record: recordUpdated, nodes: nodesUpdated, logger })
  }

export const RecordNodesUpdater = {
  updateNodesDependents,
  updateAttributesWithValues,
}
