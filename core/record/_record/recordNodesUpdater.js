import Queue from '@core/queue'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Node from '@core/record/node'

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

const getNodesToInsert = (nodeDef) => {
  if (NodeDef.isSingle(nodeDef)) return 1
  const validations = NodeDef.getValidations(nodeDef)
  return Number(NodeDefValidations.getMinCount(validations)) || 0
}

const insertNodeAndDescendants = ({ survey, nodeDef, record, node }) => {
  let recordUpdated = RecordUpdater.assocNode(node)(record)

  // Add children if entity
  const childDefs = NodeDef.isEntity(nodeDef) ? Survey.getNodeDefChildren(nodeDef)(survey) : []

  // Insert only child single nodes (it allows to apply default values)
  const descendantNodes = childDefs.reduce((acc, childDef) => {
    const nodesToInsert = getNodesToInsert(childDef)
    if (nodesToInsert === 0) {
      return acc
    }
    const nodesToInsertArray = [...Array(Number(nodesToInsert)).keys()]
    nodesToInsertArray.forEach(() => {
      const childNode = Node.newNode(NodeDef.getUuid(childDef), Node.getRecordUuid(node), node)
      const { record: recordUpdatedChild, nodes: childDescendantNodes } = insertNodeAndDescendants({
        survey,
        nodeDef: childDef,
        record: recordUpdated,
        node: childNode,
      })
      recordUpdated = recordUpdatedChild
      Object.assign(acc, childDescendantNodes)
    })
    return acc
  }, {})

  return {
    record: recordUpdated,
    nodes: { ...descendantNodes, [Node.getUuid(node)]: node },
  }
}

const updateNodesDependents = ({ survey, record, nodes, logger }) => {
  // Output
  const nodesUpdated = { ...nodes }

  const nodesUpdatedToPersist = {}
  const nodesToVisit = new Queue(Object.values(nodes))

  const visitedCountByUuid = {} // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)

  let recordUpdated = record

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

const updateOrAddAttribute =
  ({ survey, entity, attributeDef, value }) =>
  (record) => {
    const attributeDefUuid = NodeDef.getUuid(attributeDef)
    const attribute = RecordReader.getNodeChildByDefUuid(entity, attributeDefUuid)(record)
    let attributeUpdated
    if (!attribute) {
      // insert new attribute
      attributeUpdated = Node.newNode(attributeDefUuid, record.uuid, entity, value)
    } else if (
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
      attributeUpdated = Node.assocValue(value)(attribute)
    }
    const recordUpdated = RecordUpdater.assocNode(attributeUpdated)(record)

    return { attribute: attributeUpdated, record: recordUpdated }
  }

const insertEntityAndKeyValues =
  ({ survey, entityDef, parentNode, keyValuesByDefUuid }) =>
  (record) => {
    const nodesUpdated = {}
    const entity = Node.newNode(NodeDef.getUuid(entityDef), record.uuid, parentNode)
    const { record: recordUpdatedDescendants, nodes: nodeAndDescendants } = insertNodeAndDescendants({
      survey,
      nodeDef: entityDef,
      record,
      node: entity,
    })
    Object.assign(nodesUpdated, nodeAndDescendants)
    let recordUpdated = recordUpdatedDescendants

    const keyDefs = Survey.getNodeDefKeys(entityDef)(survey)
    keyDefs.forEach((keyDef) => {
      const keyValue = keyValuesByDefUuid[NodeDef.getUuid(keyDef)]
      const { attribute: keyNodeUpdated, record: recordUpdatedKeyNode } = updateOrAddAttribute({
        survey,
        entity,
        attributeDef: keyDef,
        value: keyValue,
      })(recordUpdated)

      nodesUpdated[Node.getUuid(keyNodeUpdated)] = keyNodeUpdated
      recordUpdated = recordUpdatedKeyNode
    })
    return { record: recordUpdated, nodes: nodesUpdated, entity }
  }

const getOrCreateEntityByKeys =
  ({ survey, entityDefUuid, valuesByDefUuid, insertMissingNodes }) =>
  (record) => {
    const nodesUpdated = {}
    const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
    const entity = RecordReader.findDescendantByKeyValues({
      survey,
      descendantDefUuid: entityDefUuid,
      keyValuesByDefUuid: valuesByDefUuid,
    })(record)

    if (entity) {
      return { entity, record, nodesUpdated }
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
    const {
      entity: entityCreated,
      record: recordUpdatedEntityInserted,
      nodes: nodesUpdatedEntityInserted,
    } = insertEntityAndKeyValues({
      survey,
      entityDef,
      parentNode: entityParent,
      keyValuesByDefUuid: valuesByDefUuid,
    })(record)

    Object.assign(nodesUpdated, nodesUpdatedEntityInserted)

    return { record: recordUpdatedEntityInserted, nodesUpdated, entity: entityCreated }
  }

const updateAttributesWithValues =
  ({ survey, entityDefUuid, valuesByDefUuid, insertMissingNodes = false }) =>
  (record) => {
    const nodesUpdated = {}
    let recordUpdated = { ...record }

    const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
    const {
      entity,
      record: recordUpdatedEntity,
      nodesUpdated: nodesUpdatedEntity,
    } = getOrCreateEntityByKeys({ survey, entityDefUuid, valuesByDefUuid, insertMissingNodes })(record)

    Object.assign(nodesUpdated, nodesUpdatedEntity)
    recordUpdated = recordUpdatedEntity

    const attributesUpdated = Object.entries(valuesByDefUuid).reduce(
      (attributesUpdatedAcc, [attributeDefUuid, value]) => {
        const attributeDef = Survey.getNodeDefByUuid(attributeDefUuid)(survey)
        if (NodeDef.isDescendantOf(entityDef)(attributeDef) && !NodeDef.isKey(attributeDef)) {
          const { attribute, record: recordUpdatedAttribute } = updateOrAddAttribute({
            survey,
            entity,
            attributeDef,
            value,
          })(recordUpdated)

          const attributeUuid = Node.getUuid(attribute)

          attributesUpdatedAcc[attributeUuid] = attribute

          nodesUpdated[attributeUuid] = attribute
          recordUpdated = recordUpdatedAttribute
        }
        return attributesUpdatedAcc
      },
      {}
    )

    const {
      record: recordUpdatedDependents,
      nodesUpdated: nodesUpdatedDependents,
      nodesUpdatedToPersist,
    } = updateNodesDependents({
      survey,
      record: recordUpdated,
      nodes: attributesUpdated,
    })
    Object.assign(nodesUpdated, nodesUpdatedDependents)
    recordUpdated = recordUpdatedDependents

    return { record: recordUpdated, nodes: nodesUpdated, nodesUpdatedToPersist }
  }

export const RecordNodesUpdater = {
  updateNodesDependents,
  updateAttributesWithValues,
}
