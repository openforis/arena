import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'
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

// ====== CREATE

export const newInstance = (valid = true, fields = {}, errors = [], warnings = []) => ({
  [keys.valid]: valid,
  ...(A.isEmpty(fields) ? {} : { [keys.fields]: fields }),
  ...(A.isEmpty(errors) ? {} : { [keys.errors]: errors }),
  ...(A.isEmpty(warnings) ? {} : { [keys.warnings]: warnings }),
})

// ====== READ

export const isValid = R.propOr(true, keys.valid)
export const isNotValid = (validation) => validation && !isValid(validation)
export const getFieldValidations = R.propOr({}, keys.fields)
export const getFieldValidation = (field, defaultValue = newInstance()) => R.pathOr(defaultValue, [keys.fields, field])
export const getFieldValidationsByFields = (fields) => (validation) =>
  fields.reduce((acc, field) => {
    const fieldValidation = getFieldValidation(field, null)(validation)
    if (fieldValidation) {
      acc[field] = fieldValidation
    }
    return acc
  }, {})

export const getErrors = R.propOr([], keys.errors)
export const isError = (validation) =>
  R.pipe(getErrors, R.isEmpty, R.not)(validation) || R.pipe(getFieldValidations, R.values, R.any(isError))(validation)

export const getWarnings = R.propOr([], keys.warnings)
export const isWarning = (validation) =>
  R.pipe(getWarnings, R.isEmpty, R.not)(validation) ||
  R.pipe(getFieldValidations, R.values, R.any(isWarning))(validation)

export const getCounts = R.propOr({}, keys.counts)
export const getErrorsCount = R.pipe(getCounts, R.propOr(0, keys.errors))
export const getWarningsCount = R.pipe(getCounts, R.propOr(0, keys.warnings))

// ====== UTILS

/**
 * Removes valid fields validations and updates 'valid' attribute.
 *
 * @param {!object} validation - The validation object to cleanup.
 * @returns {object} - The updated validation object.
 */
export const cleanup = (validation) => {
  // Cleanup fields
  let allFieldsValid = true
  const fieldsCleaned = Object.entries(getFieldValidations(validation)).reduce(
    (fieldsAcc, [field, fieldValidation]) => {
      const fieldValidationCleaned = cleanup(fieldValidation)
      if (!isValid(fieldValidationCleaned)) {
        allFieldsValid = false
        A.set(field, fieldValidationCleaned)(fieldsAcc)
      }

      return fieldsAcc
    },
    {}
  )

  return newInstance(
    allFieldsValid && !isError(validation) && !isWarning(validation),
    fieldsCleaned,
    getErrors(validation),
    getWarnings(validation)
  )
}

export const recalculateValidity = (validation) =>
  R.pipe(
    getFieldValidations,
    // Update validity in each field
    R.map(recalculateValidity),
    (fields) => {
      const errors = getErrors(validation)
      const warnings = getWarnings(validation)
      const valid = R.all(isValid, R.values(fields)) && R.isEmpty(errors) && R.isEmpty(warnings)
      return newInstance(valid, fields, errors, warnings)
    }
  )(validation)

export const updateCounts = (validation) => {
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

// ====== UPDATE

export const setValid = (valid) => ObjectUtils.setInPath([keys.valid], valid)
export const setField = (field, fieldValidation) => ObjectUtils.setInPath([keys.fields, field], fieldValidation)
export const setFieldValidations = (fieldValidations) => ObjectUtils.setInPath([keys.fields], fieldValidations)
export const setErrors = (errors) => ObjectUtils.setInPath([keys.errors], errors)
export const setWarnings = (warnings) => ObjectUtils.setInPath([keys.warnings], warnings)

export const assocFieldValidation = (field, fieldValidation) =>
  R.pipe(R.assocPath([keys.fields, field], fieldValidation), cleanup)

export const dissocFieldValidation = (field) => R.pipe(R.dissocPath([keys.fields, field]), cleanup)
export const deleteFieldValidation = (field) => (validation) =>
  Objects.dissocPath({ obj: validation, path: [keys.fields, field], sideEffect: true })

/**
 * Iterates over all the field validations and remove the ones starting with the specified value.
 *
 * @param {!string} fieldStartsWith - The start with value.
 * @returns {object} The updated validation object.
 */
export const dissocFieldValidationsStartingWith = (fieldStartsWith) => (validation) =>
  R.pipe(
    R.prop(keys.fields),
    Object.entries,
    R.reduce((accFields, [field, fieldValidation]) => {
      if (!field.startsWith(fieldStartsWith)) {
        A.set(field, fieldValidation)(accFields)
      }
      return accFields
    }, {}),
    (fieldsValidations) => R.assoc(keys.fields, fieldsValidations)(validation),
    cleanup
  )(validation)

export const mergeValidation =
  (validationNext, doCleanup = true) =>
  (validationPrev) => {
    const validationFieldsResult = { ...getFieldValidations(validationPrev) }
    const validationFieldsNext = getFieldValidations(validationNext)

    // iterate over new field validations: remove valid ones, merge invalid ones with previous ones
    Object.entries(validationFieldsNext).forEach(([fieldKey, validationFieldNext]) => {
      if (isValid(validationFieldNext)) {
        if (doCleanup) {
          // field validation valid: remove it from resulting validation
          delete validationFieldsResult[fieldKey]
        } else {
          validationFieldsResult[fieldKey] = newInstance()
        }
      } else {
        // field validation not valid: deep merge it with the previous one
        const validationFieldPrev = validationFieldsResult[fieldKey]
        const validationFieldMerged = validationFieldPrev
          ? mergeValidation(validationFieldNext, false)(validationFieldPrev)
          : validationFieldNext
        validationFieldsResult[fieldKey] = validationFieldMerged
      }
    })

    const validationResult = {
      ...validationPrev,
      [keys.fields]: validationFieldsResult,
    }
    validationResult[keys.errors] = getErrors(validationNext)
    validationResult[keys.warnings] = getWarnings(validationNext)

    return doCleanup ? cleanup(validationResult) : recalculateValidity(validationResult)
  }

export const mergeFieldValidations = (fieldValidationsNext, fieldValidationsPrev) => {
  const result = { ...fieldValidationsPrev }
  Object.entries(fieldValidationsNext).forEach(([fieldKey, fieldValidationNext]) => {
    const fieldValidationPrev = fieldValidationsPrev[fieldKey]
    result[fieldKey] = fieldValidationPrev
      ? mergeValidation(fieldValidationNext, false)(fieldValidationPrev)
      : fieldValidationNext
  })
  return result
}

// Object

export const getValidation = R.propOr(newInstance(), keys.validation)
export const hasValidation = R.has(keys.validation)
export const isObjValid = R.pipe(getValidation, isValid)
export const assocValidation = R.assoc(keys.validation)
export const dissocValidation = A.dissoc(keys.validation)
