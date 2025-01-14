import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

import * as NodeDefExpressionsValidator from './nodeDefExpressionsValidator'

const { keys } = NodeDefValidations

const validateMinCount = (propName, item) => {
  const count = Validator.getProp(propName)(item)
  if (Array.isArray(count)) {
    // return NodeDefExpressionsValidator.validate(survey, nodeDef, Survey.dependencyTypes.validations)
  }
  return Validator.validatePositiveNumber(Validation.messageKeys.nodeDefEdit.countMinMustBePositiveNumber)(
    propName,
    item
  )
}

export const validate = async (survey, nodeDef) => {
  const nodeDefValidations = NodeDef.getValidations(nodeDef)
  const validation = NodeDef.isMultiple(nodeDef)
    ? await Validator.validate(nodeDefValidations, {
        [`${keys.count}.${keys.min}`]: [validateMinCount],
        [`${keys.count}.${keys.max}`]: [
          Validator.validatePositiveNumber(Validation.messageKeys.nodeDefEdit.countMaxMustBePositiveNumber),
        ],
      })
    : Validation.newInstance()

  return R.pipe(
    Validation.assocFieldValidation(
      keys.expressions,
      await NodeDefExpressionsValidator.validate(survey, nodeDef, Survey.dependencyTypes.validations)
    ),
    R.unless(Validation.isValid, Validation.setErrors([{ key: Validation.messageKeys.nodeDefEdit.validationsInvalid }]))
  )(validation)
}
