import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import { ArrayUtils } from '@core/arrayUtils'

import * as Validation from './validation'
import * as ValidationResult from './validationResult'
import * as ValidatorFunctions from './_validator/validatorFunctions'

const extractNestedErrorsOrWarnings = (validationResultOrValidation) => {
  const errors = []
  const warnings = []
  const stack = [validationResultOrValidation]
  const addUniqueItems = (items) =>
    ArrayUtils.addItems({ items, avoidDuplicates: true, compareFn: Objects.isEqual, sideEffect: true })

  while (stack.length > 0) {
    const currentItem = stack.pop()
    if (currentItem) {
      if (typeof currentItem === 'string') {
        errors.push(currentItem)
      } else if (currentItem.key) {
        const arr = ValidationResult.isError(currentItem) ? errors : warnings
        const itemToAdd = R.omit([ValidationResult.keys.severity], currentItem)
        addUniqueItems([itemToAdd])(arr)
      } else {
        addUniqueItems(Validation.getErrors(currentItem))(errors)
        addUniqueItems(Validation.getWarnings(currentItem))(warnings)
        const fieldValidations = Validation.getFieldValidations(currentItem)
        stack.push(...Object.values(fieldValidations))
      }
    }
  }
  return { errors, warnings }
}

const validateProp = async (obj, prop, validations = []) => {
  const validationsEvaluated = await Promise.all(validations.map((validationFn) => validationFn(prop, obj)))
  const errors = []
  const warnings = []
  validationsEvaluated.forEach((validationResult) => {
    const { errors: errorsCurrent, warnings: warningsCurrent } = extractNestedErrorsOrWarnings(validationResult)
    errors.push(...errorsCurrent)
    warnings.push(...warningsCurrent)
  })
  return Validation.newInstance(R.isEmpty(errors) && R.isEmpty(warnings), {}, errors, warnings)
}

export const validate = async (obj, propsValidations, removeValidFields = true) => {
  const validation = Validation.newInstance()

  for await (const [prop, propValidations] of Object.entries(propsValidations)) {
    const validationProp = await validateProp(obj, prop, propValidations)
    const validationPropValid = Validation.isValid(validationProp)

    if (!validationPropValid || !removeValidFields) {
      const validationPropKey = R.pipe(R.split('.'), R.last)(prop)
      Validation.setField(validationPropKey, validationProp)(validation)
    }

    if (!validationPropValid) {
      Validation.setValid(false)(validation)
    }
  }

  return validation
}

// Validator functions
export const {
  getProp,
  validateRequired,
  validateItemPropUniqueness,
  validateMinLength,
  validateNotKeyword,
  validateName,
  validateNumber,
  validatePositiveNumber,
  validatePositiveOrZeroNumber,
  validateEmail,
  validateEmails,
  isEmailValueValid,
  isKeyword,
} = ValidatorFunctions
