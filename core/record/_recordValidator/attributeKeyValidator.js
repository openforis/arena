const R = require('ramda')

const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const Record = require('../record')
const Node = require('../node')
const Validation = require('@core/validation/validation')
const ObjectUtils = require('@core/objectUtils')

const validateAttributeKey = (survey, record, attributeDef) => async (propName, node) => {
  const nodeDefParent = Survey.getNodeDefParent(attributeDef)(survey)
  if (!NodeDef.isRoot(nodeDefParent) && NodeDef.isKey(attributeDef)) {
    const entity = Record.getParentNode(node)(record)
    if (_isEntityDuplicate(survey, record, entity)) {
      return { key: Validation.messageKeys.record.entityKeyDuplicate }
    }
  }
  return null
}

const _isEntityDuplicate = (survey, record, entity) => {
  // 1. get sibling entities
  const nodeParent = Record.getParentNode(entity)(record)
  const siblingEntities = R.pipe(
    Record.getNodeChildrenByDefUuid(nodeParent, Node.getNodeDefUuid(entity)),
    R.reject(ObjectUtils.isEqual(entity))
  )(record)

  // 2. get key values
  const keyValues = Record.getEntityKeyValues(survey, entity)(record)

  return R.isEmpty(siblingEntities) || R.isEmpty(keyValues)
    ? false
    : R.any(siblingEntity => R.equals(keyValues, Record.getEntityKeyValues(survey, siblingEntity)(record)), siblingEntities)
}

module.exports = {
  validateAttributeKey
}