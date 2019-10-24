const R = require('ramda')

const Validation = require('@core/validation/validation')
const Node = require('./node')
const NodeDef = require('@core/survey/nodeDef')

const keys = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys',
  childrenCount: 'childrenCount',
  minCount: 'minCount',
  maxCount: 'maxCount',
}

const getValidationChildrenCount = (parentNode, childDef) => R.pipe(
  Validation.getFieldValidation(Node.getUuid(parentNode)),
  Validation.getFieldValidation(keys.childrenCount),
  Validation.getFieldValidation(NodeDef.getUuid(childDef))
)

const getNodeValidation = node =>
  R.pipe(
    Validation.getFieldValidation(Node.getUuid(node)),
    Validation.dissocFieldValidation(keys.childrenCount)
  )

module.exports = {
  keys,

  // READ
  getNodeValidation,

  getValidationChildrenCount,
}