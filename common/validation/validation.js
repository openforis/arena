const R = require('ramda')

const ObjectUtils = require('../objectUtils')

const keys = {
  fields: 'fields',
  valid: 'valid',
  errors: 'errors',
}

//====== UTILS

/**
 * Removes valid fields validations and updates 'valid' attribute
 */
const cleanup = validation => R.pipe(
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
  newValidation => {
    const errors = getErrors(validation)
    return R.isEmpty(errors)
      ? newValidation
      : R.pipe(
        setValid(false),
        setErrors(errors)
      )(newValidation)
  }
)(validation)

const recalculateValidity = validation => R.pipe(
  getFieldValidations,
  // update validity in each field
  R.map(recalculateValidity),
  fields => {
    const errors = getErrors(validation)
    const valid = R.all(isValid, R.values(fields)) && R.isEmpty(errors)
    return newInstance(valid, fields, errors)
  }
)(validation)

//====== CREATE

const newInstance = (valid = true, fields = {}, errors = []) => ({
  [keys.valid]: valid,
  [keys.fields]: fields,
  [keys.errors]: errors,
})

//====== READ

const isValid = R.propOr(true, keys.valid)
const getFieldValidations = R.propOr({}, keys.fields)
const getFieldValidation = field => R.pathOr(newInstance(), [keys.fields, field])

const getErrors = R.propOr([], keys.errors)
const hasErrors = R.pipe(getErrors, R.isEmpty, R.not)

//====== UPDATE

const setValid = valid => ObjectUtils.setInPath([keys.valid], valid)
const setFields = fields => ObjectUtils.setInPath([keys.fields], fields)
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

module.exports = {
  keys,

  newInstance,

  isValid,
  getFieldValidations,
  getFieldValidation,

  getErrors,
  hasErrors,

  setValid,
  setFields,
  setField,
  setErrors,

  assocFieldValidation,
  dissocFieldValidation,
  mergeValidation,
  recalculateValidity,

}