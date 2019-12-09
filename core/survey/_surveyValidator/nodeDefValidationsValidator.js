import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

import * as NodeDefExpressionsValidator from './nodeDefExpressionsValidator'

export const validate = async (survey, nodeDef) => {
  const nodeDefValidations = NodeDef.getValidations(nodeDef)
  const validation = NodeDef.isMultiple(nodeDef)
    ? await Validator.validate(nodeDefValidations, {
        [`${NodeDefExpression.keys.count}.${NodeDefExpression.keys.min}`]: [
          Validator.validatePositiveNumber(Validation.messageKeys.nodeDefEdit.countMinMustBePositiveNumber),
        ],
        [`${NodeDefExpression.keys.count}.${NodeDefExpression.keys.max}`]: [
          Validator.validatePositiveNumber(Validation.messageKeys.nodeDefEdit.countMaxMustBePositiveNumber),
        ],
      })
    : Validation.newInstance()

  return R.pipe(
    Validation.assocFieldValidation(
      NodeDefValidations.keys.expressions,
      await NodeDefExpressionsValidator.validate(survey, nodeDef, Survey.dependencyTypes.validations),
    ),
    R.unless(
      Validation.isValid,
      Validation.setErrors([{ key: Validation.messageKeys.nodeDefEdit.validationsInvalid }]),
    ),
  )(validation)
}
