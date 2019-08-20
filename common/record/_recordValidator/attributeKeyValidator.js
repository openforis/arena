const R = require('ramda')

const Survey = require('../../survey/survey')
const NodeDef = require('../../survey/nodeDef')
const Record = require('../record')
const Node = require('../node')

const errorKeys = {
  duplicateEntityKey: 'duplicateEntityKey'
}

const validateAttributeKey = (survey, record, attributeDef) => async (propName, node) => {
  const nodeDefParent = Survey.getNodeDefParent(attributeDef)(survey)
  if (!NodeDef.isRoot(nodeDefParent) && NodeDef.isKey(attributeDef)) {
    const entity = Record.getParentNode(node)(record)
    if (_isEntityDuplicate(survey, record, entity)) {
      return { key: errorKeys.duplicateEntityKey }
    }
  }
  return null
}

const _isEntityDuplicate = (survey, record, entity) => {
  // 1. get sibling entities
  const parentNode = Record.getParentNode(entity)(record)
  const siblingEntitiesAndSelf = Record.getNodeChildrenByDefUuid(parentNode, Node.getNodeDefUuid(entity))(record)
  const siblingEntities = R.reject(R.propEq(Node.keys.uuid, Node.getUuid(entity)), siblingEntitiesAndSelf)
  // 2. get key values
  const keyValues = Record.getEntityKeyValues(survey, entity)(record)
  // 3. find duplicate sibling entity with same key values
  for (const siblingEntity of siblingEntities) {
    const siblingKeyValues = Record.getEntityKeyValues(survey, siblingEntity)(record)
    if (R.equals(keyValues, siblingKeyValues)) {
      return true
    }
  }
  return false
}

module.exports = {
  validateAttributeKey
}