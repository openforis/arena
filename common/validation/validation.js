const R = require('ramda')

const ValidatorErrorKeys = require('./_validator/validatorErrorKeys')
const ObjectUtils = require('../objectUtils')

// const objectInvalid = {
//   [keys.valid]: false,
//   [keys.errors]: [{ key: 'error_key', params }],
//   [keys.warnings]: [{ key: 'error_key', params }],
//   [keys.fields]: {
//      'aaa': {
//        [keys.valid]: false,
//        [keys.errors]: [{ key: 'error_key', params }],
//        [keys.warnings]: [{ key: 'error_key', params }],
//        [keys.fields]: {
//          'bbb': {
//            [keys.valid]: false,
//            [keys.errors]: [{ key: 'error_key', params }],
//            [keys.warnings]: [{ key: 'error_key', params }],
//        }
//     }
//   },
// }

const keys = {
  fields: 'fields',
  valid: 'valid',
  errors: 'errors',
  warnings: 'warnings',

  customErrorMessageKey: 'custom',

  validation: 'validation',
}

//====== UTILS

/**
 * Removes valid fields validations and updates 'valid' attribute
 */
const cleanup = validation => {
  const cleanupArrayProp = propName =>
    validationCleaned => {
      const valuesOld = R.propOr([], propName)(validation)
      return R.isEmpty(valuesOld)
        ? validationCleaned
        : R.pipe(
          R.assoc(propName, valuesOld),
          setValid(false),
        )(validationCleaned)
    }

  return R.pipe(
    getFieldValidations,
    // cleanup field validations
    R.map(cleanup),
    R.reject(isValid),
    R.ifElse(
      R.isEmpty,
      () => newInstance(),
      invalidFieldValidations => newInstance(false, invalidFieldValidations),
    ),
    // cleanup errors
    cleanupArrayProp(keys.errors),
    // cleanup warnings
    cleanupArrayProp(keys.warnings),
  )(validation)
}

const recalculateValidity = validation => R.pipe(
  getFieldValidations,
  // update validity in each field
  R.map(recalculateValidity),
  fields => {
    const errors = getErrors(validation)
    const warnings = getWarnings(validation)
    const valid = R.all(isValid, R.values(fields)) && R.isEmpty(errors) && R.isEmpty(warnings)
    return newInstance(valid, fields, errors, warnings)
  }
)(validation)

//====== CREATE

const newInstance = (valid = true, fields = {}, errors = [], warnings = []) => ({
  [keys.valid]: valid,
  [keys.fields]: fields,
  [keys.errors]: errors,
  [keys.warnings]: warnings,
})

//====== READ

const isValid = R.propOr(true, keys.valid)
const getFieldValidations = R.propOr({}, keys.fields)
const getFieldValidation = field => R.pathOr(newInstance(), [keys.fields, field])

const getErrors = R.propOr([], keys.errors)
const hasErrors = R.pipe(getErrors, R.isEmpty, R.not)
const getWarnings = R.propOr([], keys.warnings)

//====== UPDATE

const setValid = valid => ObjectUtils.setInPath([keys.valid], valid)
const setField = (field, fieldValidation) => ObjectUtils.setInPath([keys.fields, field], fieldValidation)
const setErrors = errors => ObjectUtils.setInPath([keys.errors], errors)

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

// Object

const getValidation = R.propOr(newInstance(), keys.validation)
const isObjValid = R.pipe(getValidation, isValid)
const assocValidation = R.assoc(keys.validation)

module.exports = {
  keys,

  messageKeys: ValidatorErrorKeys,

  newInstance,

  isValid,
  getFieldValidations,
  getFieldValidation,

  getErrors,
  hasErrors,

  setValid,
  setField,
  setErrors,

  assocFieldValidation,
  dissocFieldValidation,
  mergeValidation,
  recalculateValidity,

  // Object
  getValidation,
  isObjValid,
  assocValidation,
}