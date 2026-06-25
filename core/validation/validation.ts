import { Validation, ValidationFactory, Validations } from '@openforis/arena-core'

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

export type ValidationInstance = Validation

export const keys = Validations.keys

export const messageKeys = ValidatorErrorKeys

// ====== CREATE

export const newInstance = ValidationFactory.createInstance

export const {
  isValid,
  isNotValid,
  getFieldValidations,
  getFieldValidation,
  getFieldValidationsByFields,
  getErrors,
  hasErrors: isError,
  getWarnings,
  hasWarnings: isWarning,
  getCounts,
  getErrorsCount,
  getWarningsCount,
  cleanup,
  recalculateValidity,
  updateCounts,
  setValid,
  setFieldValidation: setField,
  setFieldValidations,
  setErrors,
  setWarnings,
  assocFieldValidation,
  dissocFieldValidation,
  dissocFieldValidationsStartingWith,
  mergeValidation,
  mergeFieldValidations,
  getValidation,
  hasValidation,
  isObjValid,
  assocValidation,
  dissocValidation,
} = Validations

export const deleteFieldValidation =
  (field: string) =>
  (validation: Validation): Validation =>
    Validations.dissocFieldValidation(field, true)(validation)
