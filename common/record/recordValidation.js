const R = require('ramda')

const Validator = require('../validation/validator')
const Node = require('./node')
const NodeDef = require('../survey/nodeDef')
const NodeDefValidations = require('../survey/nodeDefValidations')

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

const getMinCountValidation = (parentNode, childDef) => R.pipe(
  getChildrenCountValidation,
  Validator.getFieldValidation('minCount')
)(parentNode, childDef)

const getMaxCountValidation = (parentNode, childDef) => R.pipe(
  getChildrenCountValidation,
  Validator.getFieldValidation('maxCount')
)(parentNode, childDef)

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

  getMinCountValidation,
  getMaxCountValidation
}