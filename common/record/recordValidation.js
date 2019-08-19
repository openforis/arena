const R = require('ramda')

const Validator = require('../validation/validator')
const Node = require('./node')
const NodeDef = require('../survey/nodeDef')

const keys = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys',
  childrenCount: 'childrenCount',
  minCount: 'minCount',
  maxCount: 'maxCount',
}

const keysError = {
  duplicateRecordKey: 'duplicateRecordKey',
  oneOrMoreInvalidValues: 'oneOrMoreInvalidValues'
}

const getValidationChildrenCount = (parentNode, childDef) => R.pipe(
  Validator.getFieldValidation(Node.getUuid(parentNode)),
  Validator.getFieldValidation(keys.childrenCount),
  Validator.getFieldValidation(NodeDef.getUuid(childDef))
)

const getNodeValidation = node =>
  R.pipe(
    Validator.getFieldValidation(Node.getUuid(node)),
    Validator.dissocFieldValidation(keys.childrenCount)
  )

module.exports = {
  keys,
  keysError,

  // READ
  getNodeValidation,

  getValidationChildrenCount,
}