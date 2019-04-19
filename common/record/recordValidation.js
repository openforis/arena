const R = require('ramda')

const Validator = require('../validation/validator')
const Node = require('./node')
const NodeDef = require('../survey/nodeDef')

const keys = {
  recordKeys: 'recordKeys',
  entityKeys: 'entityKeys',
  childrenCount: 'childrenCount'
}

const getChildrenCountValidation = (parentNode, childDef) => R.pipe(
  Validator.getFieldValidation(Node.getUuid(parentNode)),
  Validator.getFieldValidation(keys.childrenCount),
  Validator.getFieldValidation(NodeDef.getUuid(childDef))
)

const getValidationMinCount = (parentNode, childDef) => R.pipe(
  getChildrenCountValidation(parentNode, childDef),
  Validator.getFieldValidation('minCount')
)

const getValidationMaxCount = (parentNode, childDef) => R.pipe(
  getChildrenCountValidation(parentNode, childDef),
  Validator.getFieldValidation('maxCount')
)

const getNodeValidation = node =>
  R.pipe(
    Validator.getFieldValidation(Node.getUuid(node)),
    Validator.dissocFieldValidation(keys.childrenCount)
  )

const getMultipleNodesValidation = (parentNode, childDef) =>
  getChildrenCountValidation(parentNode, childDef)

module.exports = {
  keys,

  // READ
  getNodeValidation,
  getMultipleNodesValidation,

  getChildrenCountValidation,
  getValidationMinCount,
  getValidationMaxCount
}