const R = require('ramda')

const NodeDef = require('../nodeDef')
const Validation = require('../../validation/validation')

const keys = {
  nodeDefsValidation: 'nodeDefsValidation'
}

const getNodeDefsValidation = R.propOr({}, keys.nodeDefsValidation)

const assocNodeDefsValidation = R.assoc(keys.nodeDefsValidation)

const getNodeDefValidation = nodeDef => R.pipe(
  getNodeDefsValidation,
  Validation.getFieldValidation(NodeDef.getUuid(nodeDef))
)

module.exports = {
  getNodeDefsValidation,
  assocNodeDefsValidation,
  getNodeDefValidation,
}