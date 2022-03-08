import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { DataImportValues } from './dataImportValues'

const findChildByKeyValues = ({ survey, record, parentNode, childDefUuid, valuesByDefUuid }) => {
  const childDef = Survey.getNodeDefByUuid(childDefUuid)(survey)
  const siblings = Record.getNodeChildrenByDefUuidUnsorted(parentNode, childDefUuid)(record)
  return siblings.find((sibling) => {
    if (NodeDef.isSingleEntity(childDef)) {
      return sibling
    }
    const keyDefs = Survey.getNodeDefKeys(childDef)(survey)
    return keyDefs.every((keyDef) => {
      const keyDefUuid = NodeDef.getUuid(keyDef)
      const keyAttribute = Record.getNodeChildByDefUuid(sibling, keyDefUuid)(record)
      const keyAttributeValue = Node.getValue(keyAttribute)
      const keyAttributeValueSearch = valuesByDefUuid[keyDefUuid]
      return DataImportValues.isValueEqual({
        survey,
        nodeDef: keyDef,
        value: keyAttributeValue,
        valueSearch: keyAttributeValueSearch,
      })
    })
  })
}

const findDescendantByKeyValues = ({ survey, record, descendantDefUuid, valuesByDefUuid }) => {
  const entityDef = Survey.getNodeDefByUuid(descendantDefUuid)(survey)
  const entityHierarchy = NodeDef.getMetaHierarchy(entityDef)
  let currentNode = Record.getRootNode(record)
  for (let i = 1; i < entityHierarchy.length; i++) {
    const ancestorDefUuid = entityHierarchy[i]
    const ancestorNode = findChildByKeyValues({
      survey,
      record,
      parentNode: currentNode,
      childDefUuid: ancestorDefUuid,
      valuesByDefUuid,
    })
    if (!ancestorNode) {
      throw new Error('ancestor node not found')
    }
    currentNode = ancestorNode
  }
  return currentNode
}

const updateNodesWithValues = ({ survey, record, entityDefUuid, valuesByDefUuid }) => {
  const parentNodeDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const parentNode = findDescendantByKeyValues({ survey, record, descendantDefUuid: entityDefUuid, valuesByDefUuid })
  console.log('===parentNodeDef', parentNodeDef)
  console.log('===parentNode', parentNode)
  const attributesUpdated = {}
  Object.entries(valuesByDefUuid).forEach(([attributeDefUuid, value]) => {
    const attributeDef = Survey.getNodeDefByUuid(attributeDefUuid)(survey)
    if (NodeDef.isDescendantOf(parentNodeDef)(attributeDef)) {
      const attribute = Record.getNodeChildByDefUuid(parentNode, attributeDefUuid)(record)
      console.log('====attributeDef', attributeDef)
      console.log('====attribute', attribute)
      console.log('====value', value)
      if (value !== Node.getValue(attribute)) {
        const attributeUpdated = attribute // Node.assocValue(value)(attribute)
        attributesUpdated[Node.getUuid(attribute)] = attributeUpdated
      }
    }
  })
  const {
    record: recordUpdated,
    nodesUpdated,
    nodesUpdatedToPersist,
  } = Record.updateNodesDependents({
    survey,
    record,
    nodes: attributesUpdated,
  })
  return { record: recordUpdated, nodes: nodesUpdated, nodesUpdatedToPersist }
}

export const DataImportRecordUpdater = {
  updateNodesWithValues,
}
