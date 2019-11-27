import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import { ValidatorErrorKeys } from './validatorErrorKeys'
import * as ValidatorNameKeywords from './validatorNameKeywords'

/**
 * Internal names must contain only lowercase letters, numbers and underscores starting with a letter
 */
const validNameRegex = /^[a-z][a-z0-9_]*$/

const getProp = (propName, defaultValue = null) =>
  R.pathOr(defaultValue, propName.split('.'))

export const validateRequired = errorKey => (propName, obj) => {
  const value = R.pipe(getProp(propName), R.defaultTo(''))(obj)

  return R.isEmpty(value) ? { key: errorKey } : null
}

export const validateItemPropUniqueness = errorKey => items => (
  propName,
  item,
) => {
  const hasDuplicates = R.any(
    i =>
      !ObjectUtils.isEqual(i)(item) &&
      getProp(propName)(i) === getProp(propName)(item),
    items,
  )

  return hasDuplicates ? { key: errorKey } : null
}

export const validateNotKeyword = errorKey => (propName, item) => {
  const value = getProp(propName)(item)
  return ValidatorNameKeywords.isKeyword(value)
    ? { key: errorKey, params: { value } }
    : null
}

export const validateName = errorKey => (propName, item) => {
  const prop = getProp(propName)(item)
  return prop && !validNameRegex.test(prop) ? { key: errorKey } : null
}

export const validatePositiveNumber = errorKey => (propName, item) => {
  const value = getProp(propName)(item)

  if (value && isNaN(value)) {
    return { key: ValidatorErrorKeys.invalidNumber }
  }

  if (value && value <= 0) {
    return { key: errorKey }
  }

  return null
}

export const isKeyword = ValidatorNameKeywords.isKeyword
