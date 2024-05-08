import * as R from 'ramda'

import * as Validation from './validation'
import * as ValidationResult from './validationResult'
import * as ValidatorFunctions from './_validator/validatorFunctions'

const validateProp = async (obj, prop, validations = []) => {
  const validationsEvaluated = await Promise.all(validations.map((validationFn) => validationFn(prop, obj)))

  const errors = []
  const warnings = []
  validationsEvaluated.forEach((validationResult) => {
    if (validationResult) {
      // Add validation result to errors or warnings
      const arr = ValidationResult.isError(validationResult) ? errors : warnings
      arr.push(R.omit([ValidationResult.keys.severity], validationResult))
    }
  })

  return Validation.newInstance(R.isEmpty(errors) && R.isEmpty(warnings), {}, errors, warnings)
}

export const validate = async (obj, propsValidations, removeValidFields = true) => {
  const validation = Validation.newInstance()

  for (const [prop, propValidations] of Object.entries(propsValidations)) {
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
  validateRequired,
  validateItemPropUniqueness,
  validateMinLength,
  validateNotKeyword,
  validateName,
  validateNumber,
  validatePositiveNumber,
  validateEmail,
  validateEmails,
  isEmailValueValid,
  isKeyword,
} = ValidatorFunctions
