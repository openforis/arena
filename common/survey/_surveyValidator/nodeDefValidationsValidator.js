const R = require('ramda')

const NodeDefValidations = require('../nodeDefValidations')
const NodeDef = require('../nodeDef')
const Validator = require('../../validation/validator')
const NodeDefExpressionsValidator = require('./nodeDefExpressionsValidator')

const validate = async (survey, nodeDef, nodeDefValidations, errorKey = null) => {
  const validation = NodeDef.isMultiple(nodeDef)
    ? await Validator.validate(nodeDefValidations, {
      [`${NodeDefValidations.keys.count}.${NodeDefValidations.keys.min}`]:
        [Validator.validatePositiveNumber(Validator.messageKeys.nodeDefEdit.countMinMustBePositiveNumber)],
      [`${NodeDefValidations.keys.count}.${NodeDefValidations.keys.max}`]:
        [Validator.validatePositiveNumber(Validator.messageKeys.nodeDefEdit.countMaxMustBePositiveNumber)],
    })
    : {}

  return R.pipe(
    R.assocPath(
      [Validator.keys.fields, NodeDefValidations.keys.expressions],
      await NodeDefExpressionsValidator.validate(survey, nodeDef, NodeDefValidations.getExpressions(nodeDefValidations), false)
    ),
    Validator.cleanup,
    R.when(
      validation => errorKey && !Validator.isValidationValid(validation) && !Validator.hasErrors(validation),
      R.assoc(Validator.keys.errors, [{ key: errorKey }])
    )
  )(validation)
}

module.exports = {
  validate
}