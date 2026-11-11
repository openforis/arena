import * as A from '@core/arena'

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
      : Validator.validatePositiveOrZeroNumber(errorKey)(propName, item)
  }

// "required if" is allowed only for single non-key attributes, as an alternative to "always required"
const canHaveRequiredIf = (nodeDef) =>
  NodeDef.isAttribute(nodeDef) &&
  NodeDef.isSingle(nodeDef) &&
  !NodeDef.isKey(nodeDef) &&
  !NodeDefValidations.isRequired(NodeDef.getValidations(nodeDef))

const validateRequiredIf = async (survey, nodeDef) => {
  if (!NodeDefValidations.isRequiredIfDefined(NodeDef.getValidations(nodeDef))) return null
  if (!canHaveRequiredIf(nodeDef)) {
    return Validation.newInstance(false, {}, [{ key: Validation.messageKeys.nodeDefEdit.requiredIfNotAllowed }])
  }
  return NodeDefExpressionsValidator.validate(survey, nodeDef, Survey.dependencyTypes.required)
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

  return A.pipe(
    Validation.assocFieldValidation(
      keys.expressions,
      await NodeDefExpressionsValidator.validate(survey, nodeDef, Survey.dependencyTypes.validations)
    ),
    Validation.assocFieldValidation(keys.requiredIf, await validateRequiredIf(survey, nodeDef)),
    A.unless(Validation.isValid, Validation.setErrors([{ key: Validation.messageKeys.nodeDefEdit.validationsInvalid }]))
  )(validation)
}
