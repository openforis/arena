import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'
import { ValidatorErrorKeys } from './validatorErrorKeys'
import * as ValidatorNameKeywords from './validatorNameKeywords'

/**
 * Internal names must contain only lowercase letters, numbers and underscores starting with a letter.
 */
const validNameRegex = /^[a-z][a-z0-9_]{0,39}$/ // At most 40 characters long

const validEmailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const getProp = (propName, defaultValue = null) => R.pathOr(defaultValue, propName.split('.'))

export const validateRequired = (errorKey) => (propName, obj) => {
  const value = R.pipe(getProp(propName), R.defaultTo(''))(obj)
  return R.isEmpty(value) ? { key: errorKey } : null
}

export const validateItemPropUniqueness = (errorKey) => (items) => (propName, item) => {
  const hasDuplicates = R.any(
    (i) => !ObjectUtils.isEqual(i)(item) && getProp(propName)(i) === getProp(propName)(item),
    items
  )

  return hasDuplicates ? { key: errorKey } : null
}

export const validateNotKeyword = (errorKey) => (propName, item) => {
  const value = getProp(propName)(item)
  return ValidatorNameKeywords.isKeyword(value) ? { key: errorKey, params: { value } } : null
}

export const validateName =
  (errorKey, errorParams = {}) =>
  (propName, item) => {
    const prop = getProp(propName)(item)
    return prop && !validNameRegex.test(prop) ? { key: errorKey, params: errorParams } : null
  }

export const validateNumber =
  (errorKey = ValidatorErrorKeys.invalidNumber, errorParams = {}) =>
  (propName, item) => {
    const value = getProp(propName)(item)

    return value && isNaN(value) ? { key: errorKey, params: errorParams } : null
  }

export const validatePositiveNumber =
  (errorKey, errorParams = {}) =>
  (propName, item) => {
    const validateNumberResult = validateNumber(errorKey, errorParams)(propName, item)
    if (validateNumberResult) {
      return validateNumberResult
    }

    const value = getProp(propName)(item)

    return value && value <= 0 ? { key: errorKey, params: errorParams } : null
  }

export const validateEmail =
  ({ errorKey } = { errorKey: ValidatorErrorKeys.invalidEmail }) =>
  (propName, item) => {
    const email = getProp(propName)(item)
    return email && !validEmailRegex.test(email) ? { key: errorKey } : null
  }

export const { isKeyword } = ValidatorNameKeywords

export const validateMinLength =
  ({ errorKey = ValidatorErrorKeys.minLengthNotRespected, minLength }) =>
  (propName, item) => {
    const value = getProp(propName, '')(item)
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
