const R = require('ramda')

const Validation = require('./validation')
const ValidatorFunctions = require('./_validator/validatorFunctions.js')

const validateProp = async (obj, prop, validations = []) => {
  const errors = R.reject(
    R.isNil,
    await Promise.all(
      validations.map(validationFn => validationFn(prop, obj))
    )
  )
  return Validation.newInstance(R.isEmpty(errors), {}, errors)
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