import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

import * as NodeDefExpressionsValidator from './nodeDefExpressionsValidator'

const { keys } = NodeDefValidations

const validateCountProp =
  ({ survey, nodeDef, dependencyType, errorKey }) =>
  (propName, item) => {
    const count = Validator.getProp(propName)(item)
    return Array.isArray(count)
      ? NodeDefExpressionsValidator.validate(survey, nodeDef, dependencyType)
      : Validator.validatePositiveNumber(errorKey)(propName, item)
  }

export const validate = async (survey, nodeDef) => {
  const nodeDefValidations = NodeDef.getValidations(nodeDef)
  const validation = NodeDef.isMultiple(nodeDef)
    ? await Validator.validate(nodeDefValidations, {
        [`${keys.count}.${keys.min}`]: [
          validateCountProp({
            survey,
            nodeDef,
            dependencyType: Survey.dependencyTypes.minCount,
            errorKey: Validation.messageKeys.nodeDefEdit.countMinMustBePositiveNumber,
          }),
        ],
        [`${keys.count}.${keys.max}`]: [
          validateCountProp({
            survey,
            nodeDef,
            dependencyType: Survey.dependencyTypes.maxCount,
            errorKey: Validation.messageKeys.nodeDefEdit.countMaxMustBePositiveNumber,
          }),
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
