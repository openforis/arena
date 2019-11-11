const R = require('ramda')

const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const NodeDefExpression = require('@core/survey/nodeDefExpression')
const Validator = require('@core/validation/validator')
const Validation = require('@core/validation/validation')

const NodeDefExpressionsValidator = require('./nodeDefExpressionsValidator')

const validate = async (survey, nodeDef) => {
  const nodeDefValidations = NodeDef.getValidations(nodeDef)

  const validation = NodeDef.isMultiple(nodeDef)
    ? await Validator.validate(nodeDefValidations, {
      [`${NodeDefExpression.keys.count}.${NodeDefExpression.keys.min}`]:
        [Validator.validatePositiveNumber(Validation.messageKeys.nodeDefEdit.countMinMustBePositiveNumber)],
      [`${NodeDefExpression.keys.count}.${NodeDefExpression.keys.max}`]:
        [Validator.validatePositiveNumber(Validation.messageKeys.nodeDefEdit.countMaxMustBePositiveNumber)],
    })
    : {}

  return R.pipe(
    Validation.assocFieldValidation(
      NodeDefExpression.keys.expressions,
      await NodeDefExpressionsValidator.validate(survey, nodeDef, Survey.dependencyTypes.validations)
    ),
    R.when(
      validation => !Validation.isValid(validation) && !Validation.hasErrors(validation),
      Validation.setErrors([{ key: Validation.messageKeys.nodeDefEdit.validationsInvalid }])
    )
  )(validation)
}

module.exports = {
  validate
}