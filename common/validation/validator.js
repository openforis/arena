const R = require('ramda')

const Validation = require('./validation')
const ValidationResult = require('./validationResult')
const ValidatorFunctions = require('./_validator/validatorFunctions')

const validateProp = async (obj, prop, validations = []) => {
  const validationsEvaluated = await Promise.all(
    validations.map(validationFn => validationFn(prop, obj))
  )

  const errors = []
  const warnings = []
  validationsEvaluated.forEach(validationResult => {
      if (validationResult) {
        // add validation result to errors or warnings
        const arr = ValidationResult.isError(validationResult) ? errors : warnings
        arr.push(R.omit([ValidationResult.keys.severity], validationResult))
      }
    }
  )

  return Validation.newInstance(R.isEmpty(errors) && R.isEmpty(warnings), {}, errors, warnings)
}

const validate = async (obj, propsValidations, removeValidFields = true) => {
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

module.exports = {
  validate,

  // validator functions
  validateRequired: ValidatorFunctions.validateRequired,
  validateItemPropUniqueness: ValidatorFunctions.validateItemPropUniqueness,
  validateNotKeyword: ValidatorFunctions.validateNotKeyword,
  validateName: ValidatorFunctions.validateName,
  validatePositiveNumber: ValidatorFunctions.validatePositiveNumber,
  isKeyword: ValidatorFunctions.isKeyword,
}