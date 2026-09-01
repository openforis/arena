import * as R from 'ramda'

import { Objects, Validation as ArenaValidation } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'

import { ValidatorErrorKeys } from './validatorErrorKeys'
import * as ValidatorNameKeywords from './validatorNameKeywords'

export type ValidatorResult =
  | { key: string; params?: Record<string, unknown> }
  | string
  | ArenaValidation
  | null
  | undefined

export type ValidatorFn = (propName: string, obj: unknown) => ValidatorResult | Promise<ValidatorResult>

/**
 * Internal names must contain only lowercase letters, numbers and underscores starting with a letter.
 */
const validNameRegex = /^[a-z][a-z0-9_]{0,39}$/ // At most 40 characters long

const validEmailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const getProp =
  (propName: string, defaultValue: unknown = null) =>
  (obj: unknown): unknown =>
    R.pathOr(defaultValue, propName.split('.'))(obj as Record<string, unknown>)

export const validateRequired =
  (errorKey: string): ValidatorFn =>
  (propName, obj) => {
    const value = R.pipe(getProp(propName), R.defaultTo(''))(obj)
    return R.isEmpty(value as string) ? { key: errorKey } : null
  }

export const validateItemPropUniqueness =
  (errorKey: string) =>
  (items: Record<string, unknown>[]): ValidatorFn =>
  (propName, item: Record<string, unknown>) => {
    const hasDuplicates =
      items &&
      R.any(
        (i: Record<string, unknown>) =>
          !ObjectUtils.isEqual(i)(item) && getProp(propName)(i) === getProp(propName)(item),
        items
      )
    return hasDuplicates ? { key: errorKey } : null
  }

export const validateNotKeyword =
  (errorKey: string): ValidatorFn =>
  (propName, item) => {
    const value = getProp(propName)(item)
    return ValidatorNameKeywords.isKeyword(value) ? { key: errorKey, params: { value } } : null
  }

export const validateName =
  (errorKey: string, errorParams: Record<string, unknown> = {}): ValidatorFn =>
  (propName, item) => {
    const prop = getProp(propName)(item)
    const params = { ...errorParams, name: prop }
    return prop && !validNameRegex.test(prop as string) ? { key: errorKey, params } : null
  }

export const validateNumber =
  (errorKey = ValidatorErrorKeys.invalidNumber, errorParams: Record<string, unknown> = {}): ValidatorFn =>
  (propName, item) => {
    const value = getProp(propName)(item)

    return value && isNaN(value as number) ? { key: errorKey, params: errorParams } : null
  }

export const validatePositiveNumber = (errorKey: string, errorParams: Record<string, unknown> = {}): ValidatorFn =>
  validatePositiveOrZeroNumber(errorKey, errorParams, false)

export const validatePositiveOrZeroNumber =
  (errorKey: string, errorParams: Record<string, unknown> = {}, allowZero = true): ValidatorFn =>
  (propName, item) => {
    const validateNumberResult = validateNumber(errorKey, errorParams)(propName, item)
    if (validateNumberResult) {
      return validateNumberResult
    }

    const value = getProp(propName)(item) as number

    return value && (allowZero ? value < 0 : value <= 0) ? { key: errorKey, params: errorParams } : null
  }

export const isEmailValueValid = (email: unknown): boolean =>
  Objects.isEmpty(email) || validEmailRegex.test(email as string)

export const validateEmail =
  ({ errorKey }: { errorKey: string } = { errorKey: ValidatorErrorKeys.invalidEmail }): ValidatorFn =>
  (propName, item) => {
    const email = getProp(propName)(item)
    return isEmailValueValid(email) ? null : { key: errorKey }
  }

export const validateEmails =
  ({ errorKey }: { errorKey: string } = { errorKey: ValidatorErrorKeys.invalidEmail }): ValidatorFn =>
  (propName, item) => {
    const emails = getProp(propName, [])(item) as unknown[]
    const hasErrors = emails.some((email) => !isEmailValueValid(email))
    return hasErrors ? { key: errorKey } : null
  }

export const { isKeyword } = ValidatorNameKeywords

export const validateMinLength =
  ({
    errorKey = ValidatorErrorKeys.minLengthNotRespected,
    minLength,
  }: {
    errorKey?: string
    minLength: number
  }): ValidatorFn =>
  (propName, item) => {
    const value = getProp(propName, '')(item) as string
    if (Objects.isEmpty(value)) {
      // if the prop is required, check it with validateRequired before calling validateMinLength
      return null
    }
    const length = value.length
    if (length >= minLength) {
      return null
    }
    return { key: errorKey, params: { minLength, length } }
  }
