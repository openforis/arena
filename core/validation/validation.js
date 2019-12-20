import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import { ValidatorErrorKeys } from './_validator/validatorErrorKeys'

// Const objectInvalid = {
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

export const keys = {
  fields: 'fields',
  valid: 'valid',
  errors: 'errors',
  warnings: 'warnings',
  counts: 'counts',

  validation: 'validation',
}

export const messageKeys = ValidatorErrorKeys

// ====== UTILS

/**
 * Removes valid fields validations and updates 'valid' attribute
 */
export const cleanup = validation => {
  // Cleanup fields
  let allFieldsValid = true
  const fieldsCleaned = Object.entries(getFieldValidations(validation)).reduce(
    (fieldsAcc, [field, fieldValidation]) => {
      const fieldValidationCleaned = cleanup(fieldValidation)
      if (!isValid(fieldValidationCleaned)) {
        allFieldsValid = false
        fieldsAcc[field] = fieldValidationCleaned
      }

      return fieldsAcc
    },
    {},
  )

  return newInstance(
    allFieldsValid && !isError(validation) && !isWarning(validation),
    fieldsCleaned,
    getErrors(validation),
    getWarnings(validation),
  )
}

export const recalculateValidity = validation =>
  R.pipe(
    getFieldValidations,
    // Update validity in each field
    R.map(recalculateValidity),
    fields => {
      const errors = getErrors(validation)
      const warnings = getWarnings(validation)
      const valid = R.all(isValid, R.values(fields)) && R.isEmpty(errors) && R.isEmpty(warnings)
      return newInstance(valid, fields, errors, warnings)
    },
  )(validation)

export const updateCounts = validation => {
  let totalErrors = 0
  let totalWarnings = 0

  const stack = []
  stack.push(validation)

  while (!R.isEmpty(stack)) {
    const validationCurrent = stack.pop()

    // Update total errors
    totalErrors += R.pipe(getErrors, R.length)(validationCurrent)

    // Update total warnings
    totalWarnings += R.pipe(getWarnings, R.length)(validationCurrent)

    // Add field validations to stack
    const validationFields = getFieldValidations(validationCurrent)
    if (!R.isEmpty(validationFields)) {
      stack.push(...R.values(validationFields))
    }
  }

  return {
    ...validation,
    [keys.counts]: {
      [keys.errors]: totalErrors,
      [keys.warnings]: totalWarnings,
    },
  }
}

// ====== CREATE

export const newInstance = (valid = true, fields = {}, errors = [], warnings = []) => ({
  [keys.valid]: valid,
  [keys.fields]: fields,
  [keys.errors]: errors,
  [keys.warnings]: warnings,
})

// ====== READ

export const isValid = R.propOr(true, keys.valid)
export const getFieldValidations = R.propOr({}, keys.fields)
export const getFieldValidation = field => R.pathOr(newInstance(), [keys.fields, field])

export const getErrors = R.propOr([], keys.errors)
export const isError = validation =>
  R.pipe(getErrors, R.isEmpty, R.not)(validation) || R.pipe(getFieldValidations, R.values, R.any(isError))(validation)

export const getWarnings = R.propOr([], keys.warnings)
export const isWarning = validation =>
  R.pipe(getWarnings, R.isEmpty, R.not)(validation) ||
  R.pipe(getFieldValidations, R.values, R.any(isWarning))(validation)

export const getCounts = R.propOr({}, keys.counts)
export const getErrorsCount = R.pipe(getCounts, R.propOr(0, keys.errors))
export const getWarningsCount = R.pipe(getCounts, R.propOr(0, keys.warnings))

// ====== UPDATE

export const setValid = valid => ObjectUtils.setInPath([keys.valid], valid)
export const setField = (field, fieldValidation) => ObjectUtils.setInPath([keys.fields, field], fieldValidation)
export const setErrors = errors => ObjectUtils.setInPath([keys.errors], errors)

export const assocFieldValidation = (field, fieldValidation) =>
  R.pipe(R.assocPath([keys.fields, field], fieldValidation), cleanup)

export const dissocFieldValidation = field => R.pipe(R.dissocPath([keys.fields, field]), cleanup)
/**
 * Iterates over all the field validations and remove the ones starting with the specified value
 */
export const dissocFieldValidationsStartingWith = fieldStartsWith => validation =>
  R.pipe(
    R.prop(keys.fields),
    Object.entries,
    R.reduce((accFields, [field, fieldValidation]) => {
      if (!field.startsWith(fieldStartsWith)) accFields[field] = fieldValidation
      return accFields
    }, {}),
    fieldsValidations => R.assoc(keys.fields, fieldsValidations)(validation),
    cleanup,
  )(validation)

export const mergeValidation = validationNew => validationOld =>
  R.pipe(
    validation => ({
      [keys.fields]: R.mergeDeepRight(getFieldValidations(validation), getFieldValidations(validationNew)),
    }),
    cleanup,
  )(validationOld)

// Object

export const getValidation = R.propOr(newInstance(), keys.validation)
export const isObjValid = R.pipe(getValidation, isValid)
export const assocValidation = R.assoc(keys.validation)
