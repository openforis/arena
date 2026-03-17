import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

import { ValidatorErrorKeys } from './_validator/validatorErrorKeys'
import type { ValidationResultInstance } from './validationResult'

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
} as const

export const messageKeys = ValidatorErrorKeys

export interface ValidationInstance {
  [key: string]: unknown
  valid: boolean
  fields?: Record<string, ValidationInstance>
  errors?: ValidationResultInstance[]
  warnings?: ValidationResultInstance[]
  counts?: { errors: number; warnings: number }
}

// ====== CREATE

export const newInstance = (
  valid = true,
  fields: Record<string, ValidationInstance> = {},
  errors: ValidationResultInstance[] = [],
  warnings: ValidationResultInstance[] = []
): ValidationInstance => ({
  [keys.valid]: valid,
  ...(A.isEmpty(fields) ? {} : { [keys.fields]: fields }),
  ...(A.isEmpty(errors) ? {} : { [keys.errors]: errors }),
  ...(A.isEmpty(warnings) ? {} : { [keys.warnings]: warnings }),
})

// ====== READ

export const isValid = (validation: ValidationInstance | null | undefined): boolean =>
  !validation || R.propOr(true, keys.valid)(validation)
export const isNotValid = (validation: ValidationInstance | null | undefined): boolean =>
  !!validation && !isValid(validation)
export const getFieldValidations = R.propOr({}, keys.fields) as (
  v: ValidationInstance
) => Record<string, ValidationInstance>
const _getFieldValidation =
  (field: string | number, defaultValue = newInstance()) =>
  (validation: ValidationInstance): ValidationInstance =>
    R.pathOr(defaultValue, [keys.fields, field])(validation)
export const getFieldValidation =
  (field: string | number, defaultValue = newInstance()) =>
  (validation: ValidationInstance): ValidationInstance => {
    if (typeof field === 'string') {
      let validationCurrent = validation
      const parts = field.split('.')
      parts.some((part) => {
        validationCurrent = _getFieldValidation(part, defaultValue)(validationCurrent)
        return !validationCurrent // breaks the loop if there is no field validation
      })
      return validationCurrent
    } else {
      return _getFieldValidation(field, defaultValue)(validation)
    }
  }
export const getFieldValidationsByFields =
  (fields: (string | number)[]) =>
  (validation: ValidationInstance): Record<string, ValidationInstance> =>
    fields.reduce<Record<string, ValidationInstance>>((acc, field) => {
      const fieldValidation = getFieldValidation(field, null as unknown as ValidationInstance)(validation)
      if (fieldValidation) {
        acc[String(field)] = fieldValidation
      }
      return acc
    }, {})

export const getErrors = R.propOr([], keys.errors) as (v: ValidationInstance) => ValidationResultInstance[]
export const isError = (validation: ValidationInstance): boolean =>
  R.pipe(getErrors, R.isEmpty, R.not)(validation) || R.pipe(getFieldValidations, R.values, R.any(isError))(validation)

export const getWarnings = R.propOr([], keys.warnings) as (v: ValidationInstance) => ValidationResultInstance[]
export const isWarning = (validation: ValidationInstance): boolean =>
  R.pipe(getWarnings, R.isEmpty, R.not)(validation) ||
  R.pipe(getFieldValidations, R.values, R.any(isWarning))(validation)

export const getCounts = R.propOr({}, keys.counts) as (v: ValidationInstance) => {
  errors: number
  warnings: number
}
export const getErrorsCount = R.pipe(getCounts, R.propOr(0, keys.errors)) as (v: ValidationInstance) => number
export const getWarningsCount = R.pipe(getCounts, R.propOr(0, keys.warnings)) as (v: ValidationInstance) => number

// ====== UTILS

/**
 * Removes valid fields validations and updates 'valid' attribute.
 *
 * @param {!object} validation - The validation object to cleanup.
 * @returns {object} - The updated validation object.
 */
export const cleanup = (validation: ValidationInstance): ValidationInstance => {
  // Cleanup fields
  let allFieldsValid = true
  const fieldsCleaned = Object.entries(getFieldValidations(validation)).reduce<Record<string, ValidationInstance>>(
    (fieldsAcc, [field, fieldValidation]) => {
      const fieldValidationCleaned = cleanup(fieldValidation)
      if (!isValid(fieldValidationCleaned)) {
        allFieldsValid = false
        fieldsAcc[field] = fieldValidationCleaned
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

export const recalculateValidity = (validation: ValidationInstance): ValidationInstance =>
  R.pipe(
    getFieldValidations,
    // Update validity in each field
    R.map(recalculateValidity),
    (fields: Record<string, ValidationInstance>) => {
      const errors = getErrors(validation)
      const warnings = getWarnings(validation)
      const valid = R.all(isValid, R.values(fields)) && R.isEmpty(errors) && R.isEmpty(warnings)
      return newInstance(valid, fields, errors, warnings)
    }
  )(validation)

export const updateCounts = (validation: ValidationInstance): ValidationInstance => {
  let totalErrors = 0
  let totalWarnings = 0

  const stack: ValidationInstance[] = []
  stack.push(validation)

  while (!R.isEmpty(stack)) {
    const validationCurrent = stack.pop()!

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

  return { ...validation, [keys.counts]: { [keys.errors]: totalErrors, [keys.warnings]: totalWarnings } }
}

// ====== UPDATE

export const setValid = (valid: boolean) => ObjectUtils.setInPath([keys.valid], valid)
export const setField = (field: string, fieldValidation: ValidationInstance) =>
  ObjectUtils.setInPath([keys.fields, field], fieldValidation)
export const setFieldValidations = (fieldValidations: Record<string, ValidationInstance>) =>
  ObjectUtils.setInPath([keys.fields], fieldValidations)
export const setErrors = (errors: ValidationResultInstance[]) => ObjectUtils.setInPath([keys.errors], errors)
export const setWarnings = (warnings: ValidationResultInstance[]) => ObjectUtils.setInPath([keys.warnings], warnings)

export const assocFieldValidation = (field: string, fieldValidation: ValidationInstance) =>
  R.pipe(R.assocPath([keys.fields, field], fieldValidation), cleanup)

export const dissocFieldValidation = (field: string) => R.pipe(R.dissocPath([keys.fields, field]), cleanup)
export const deleteFieldValidation =
  (field: string) =>
  (validation: ValidationInstance): ValidationInstance =>
    Objects.dissocPath({ obj: validation, path: [keys.fields, field], sideEffect: true })

/**
 * Iterates over all the field validations and remove the ones starting with the specified value.
 *
 * @param {!string} fieldStartsWith - The start with value.
 * @returns {object} The updated validation object.
 */
export const dissocFieldValidationsStartingWith =
  (fieldStartsWith: string) =>
  (validation: ValidationInstance): ValidationInstance => {
    const validationFields = getFieldValidations(validation)
    const validationFieldsUpdated: Record<string, ValidationInstance> = {}
    for (const [field, fieldValidation] of Object.entries(validationFields)) {
      if (!field.startsWith(fieldStartsWith)) {
        validationFieldsUpdated[field] = fieldValidation
      }
    }
    const validationUpdated = R.assoc(keys.fields, validationFieldsUpdated)(validation)
    return cleanup(validationUpdated)
  }

export const mergeValidation =
  (validationNext: ValidationInstance, doCleanup = true) =>
  (validationPrev: ValidationInstance): ValidationInstance => {
    const validationFieldsResult: Record<string, ValidationInstance> = {
      ...getFieldValidations(validationPrev),
    }
    const validationFieldsNext = getFieldValidations(validationNext)

    // iterate over new field validations: remove valid ones, merge invalid ones with previous ones
    for (const [fieldKey, validationFieldNext] of Object.entries(validationFieldsNext)) {
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
    }

    const validationResult = { ...validationPrev, [keys.fields]: validationFieldsResult }
    validationResult[keys.errors] = getErrors(validationNext)
    validationResult[keys.warnings] = getWarnings(validationNext)

    return doCleanup ? cleanup(validationResult) : recalculateValidity(validationResult)
  }

export const mergeFieldValidations = (
  fieldValidationsNext: Record<string, ValidationInstance>,
  fieldValidationsPrev: Record<string, ValidationInstance>
): Record<string, ValidationInstance> => {
  const result: Record<string, ValidationInstance> = { ...fieldValidationsPrev }
  for (const [fieldKey, fieldValidationNext] of Object.entries(fieldValidationsNext)) {
    const fieldValidationPrev = fieldValidationsPrev[fieldKey]
    result[fieldKey] = fieldValidationPrev
      ? mergeValidation(fieldValidationNext, false)(fieldValidationPrev)
      : fieldValidationNext
  }
  return result
}

// Object

export const getValidation = R.propOr(newInstance(), keys.validation) as (
  v: Record<string, unknown>
) => ValidationInstance
export const hasValidation = R.has(keys.validation) as (v: Record<string, unknown>) => boolean
export const isObjValid = R.pipe(getValidation, isValid) as (v: Record<string, unknown>) => boolean
export const assocValidation = R.assoc(keys.validation) as (
  v: ValidationInstance
) => (obj: Record<string, unknown>) => Record<string, unknown>
export const dissocValidation = A.dissoc(keys.validation) as (obj: Record<string, unknown>) => Record<string, unknown>
