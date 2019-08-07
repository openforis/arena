const R = require('ramda')

const NodeDef = require('../nodeDef')
const Validator = require('../../validation/validator')

const keys = {
  nodeDefsValidation: 'nodeDefsValidation'
}

const getNodeDefsValidation = R.propOr({}, keys.nodeDefsValidation)

const assocNodeDefsValidation = R.assoc(keys.nodeDefsValidation)

const getNodeDefValidation = nodeDef => R.pipe(
  getNodeDefsValidation,
  Validator.getFieldValidation(NodeDef.getUuid(nodeDef))
)

module.exports = {
  getNodeDefsValidation,
  assocNodeDefsValidation,
  getNodeDefValidation,
}