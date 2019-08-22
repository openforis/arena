const R = require('ramda')

const NodeDefValidations = require('../nodeDefValidations')
const NodeDef = require('../nodeDef')
const Validator = require('../../validation/validator')
const NodeDefExpressionsValidator = require('./nodeDefExpressionsValidator')

const keysErrors = {
  countMaxPositiveNumber: 'nodeDefEdit.validationErrors.countMaxPositiveNumber',
  countMinPositiveNumber: 'nodeDefEdit.validationErrors.countMinPositiveNumber',
}

const validate = async (survey, nodeDef, nodeDefValidations) => {
  const validation = NodeDef.isMultiple(nodeDef)
    ? await Validator.validate(nodeDefValidations, {
      [`${NodeDefValidations.keys.count}.${NodeDefValidations.keys.min}`]: [Validator.validatePositiveNumber(keysErrors.countMinPositiveNumber)],
      [`${NodeDefValidations.keys.count}.${NodeDefValidations.keys.max}`]: [Validator.validatePositiveNumber(keysErrors.countMaxPositiveNumber)],
    })
    : {}

  return R.pipe(
    R.assocPath(
      [Validator.keys.fields, NodeDefValidations.keys.expressions],
      await NodeDefExpressionsValidator.validate(survey, nodeDef, NodeDefValidations.getExpressions(nodeDefValidations), false)
    ),
    Validator.cleanup
  )(validation)
}

module.exports = {
  validate
}