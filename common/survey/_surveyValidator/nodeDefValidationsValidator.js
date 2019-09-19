const R = require('ramda')

const NodeDefValidations = require('../nodeDefValidations')
const NodeDef = require('../nodeDef')
const Validator = require('../../validation/validator')
const Validation = require('../../validation/validation')
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
    Validation.assocFieldValidation(
      NodeDefValidations.keys.expressions,
      await NodeDefExpressionsValidator.validate(survey, nodeDef, NodeDefValidations.getExpressions(nodeDefValidations), false)
    ),
    R.when(
      validation => errorKey && !Validation.isValid(validation) && !Validation.hasErrors(validation),
      Validation.setErrors([{ key: errorKey }])
    )
  )(validation)
}

module.exports = {
  validate
}