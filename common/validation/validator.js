const R = require('ramda')

const ValidatorFunctions = require('./_validator/validatorFunctions.js')

// const objectInvalid = {
//   [keys.valid]: false,
//   [keys.fields]: {
//     'aaa': {
//       errors: [{ key: 'error_key', params }],
//       warnings: [{ key: 'error_key', params }],
//     }
//   },
// }

const keys = {
  fields: 'fields',
  valid: 'valid',
  errors: 'errors',
  validation: 'validation',
  customErrorMessageKey: 'custom',
}

const newValidationValid = () => ({
  [keys.valid]: true,
  [keys.fields]: {},
})

const validateProp = async (obj, prop, validations = []) => {
  const errors = R.reject(
    R.isNil,
    await Promise.all(
      validations.map(validationFn => validationFn(prop, obj))
    )
  )
  return {
    [keys.valid]: R.isEmpty(errors),
    [keys.errors]: errors,
  }
}

const validate = async (obj, propsValidations, performCleanup = true) => {
  const validation = newValidationValid()

  for (const prop of Object.keys(propsValidations)) {
    const validationProp = await validateProp(obj, prop, propsValidations[prop])
    const validationPropKey = R.pipe(R.split('.'), R.last)(prop)
    validation[keys.fields][validationPropKey] = validationProp

    if (!isValidationValid(validationProp)) {
      validation[keys.valid] = false
    }
  }

  return performCleanup
    ? cleanup(validation)
    : validation
}

//==== getters
const getValidation = R.propOr(newValidationValid(), keys.validation)

//TODO rename to isValid
const isValidationValid = R.propOr(true, keys.valid)

//TODO rename to isObjValid
const isValid = R.pipe(getValidation, isValidationValid)

const getFieldValidations = R.propOr({}, keys.fields)

const getFieldValidation = field => R.pathOr(newValidationValid(), [keys.fields, field])

const getInvalidFieldValidations = R.pipe(
  getFieldValidations,
  R.reject(isValidationValid)
)

const getErrors = R.propOr([], keys.errors)

const hasErrors = R.pipe(getErrors, R.isEmpty, R.not)

//==== update
/**
 * Removes valid fields validations and updates 'valid' attribute
 */
const cleanup = validation => R.pipe(
  getFieldValidations,
  // cleanup field validations
  R.map(cleanup),
  R.reject(isValidationValid),
  R.ifElse(
    R.isEmpty,
    () => newValidationValid(),
    invalidFieldValidations => ({
      [keys.fields]: invalidFieldValidations,
      [keys.valid]: false
    }),
  ),
  // cleanup errors
  newValidation => {
    const errors = getErrors(validation)
    return R.isEmpty(errors)
      ? newValidation
      : {
        ...newValidation,
        [keys.errors]: errors,
        [keys.valid]: false
      }
  }
)(validation)

const assocValidation = v => R.assoc(keys.validation, v)

const assocFieldValidation = (field, fieldValidation) => R.pipe(
  R.assocPath([keys.fields, field], fieldValidation),
  cleanup
)

const dissocFieldValidation = field => R.pipe(
  R.dissocPath([keys.fields, field]),
  cleanup
)

const mergeValidation = validationNew => validationOld => R.pipe(
  validation => ({
    [keys.fields]: R.mergeDeepRight(
      getFieldValidations(validation),
      getFieldValidations(validationNew)
    )
  }),
  cleanup,
)(validationOld)

const recalculateValidity = validation =>
  R.pipe(
    getFieldValidations,
    // update validity in each field
    R.map(recalculateValidity),
    newFields => {
      const errors = getErrors(validation)
      return R.pipe(
        R.assoc(keys.valid, R.all(isValidationValid, R.values(newFields)) && R.isEmpty(errors)),
        R.assoc(keys.fields, newFields)
      )(validation)
    }
  )(validation)

module.exports = {
  keys,

  newValidationValid,

  validate,

  // READ
  getValidation,
  isValidationValid,
  isValid,
  getFieldValidation,
  getFieldValidations,
  getInvalidFieldValidations,
  getErrors,
  hasErrors,

  // UPDATE
  cleanup,
  assocValidation,
  assocFieldValidation,
  dissocFieldValidation,
  mergeValidation,
  recalculateValidity,

  // validator functions
  validateRequired: ValidatorFunctions.validateRequired,
  validateItemPropUniqueness: ValidatorFunctions.validateItemPropUniqueness,
  validateNotKeyword: ValidatorFunctions.validateNotKeyword,
  validateName: ValidatorFunctions.validateName,
  validatePositiveNumber: ValidatorFunctions.validatePositiveNumber,
  isKeyword: ValidatorFunctions.isKeyword,

}