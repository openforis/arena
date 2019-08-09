const R = require('ramda')

const NodeDefValidations = require('../nodeDefValidations')
const NodeDef = require('../nodeDef')
const Validator = require('../../validation/validator')
const NodeDefExpressionsValidator = require('./nodeDefExpressionsValidator')

const validate = async (survey, nodeDef, nodeDefValidations) => {
  const validation = NodeDef.isMultiple(nodeDef)
    ? await Validator.validate(nodeDefValidations, {
      'count.min': [Validator.validatePositiveNumber],
      'count.max': [Validator.validatePositiveNumber],
    })
    : {}

  return R.pipe(
    R.assocPath(
      ['fields', 'expressions'],
      await NodeDefExpressionsValidator.validate(survey, nodeDef, NodeDefValidations.getExpressions(nodeDefValidations), false)
    ),
    Validator.cleanup
  )(validation)
}

module.exports = {
  validate
}