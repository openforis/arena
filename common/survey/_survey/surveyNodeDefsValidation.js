const R = require('ramda')

const keys = {
  nodeDefsValidation: 'nodeDefsValidation'
}

const getNodeDefsValidation = R.propOr({}, keys.nodeDefsValidation)

const assocNodeDefsValidation = R.assoc(keys.nodeDefsValidation)

module.exports = {
  getNodeDefsValidation,
  assocNodeDefsValidation,
}