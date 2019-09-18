const R = require('ramda')

const ValidatorErrorKeys = require('./validatorErrorKeys')
const ValidatorNameKeywords = require('./validatorNameKeywords')

/**
 * Internal names must contain only lowercase letters, numbers and underscores starting with a letter
 */
const validNameRegex = /^[a-z][a-z0-9_]*$/

const getProp = (propName, defaultValue = null) => R.pathOr(defaultValue, propName.split('.'))

const validateRequired = errorKey => (propName, obj) => {
  const value = R.pipe(
    getProp(propName),
    R.defaultTo(''),
  )(obj)

  return R.isEmpty(value)
    ? { key: errorKey }
    : null
}

const validateItemPropUniqueness = errorKey => items => (propName, item) => {
  const hasDuplicates = R.any(
    i => getProp(propName)(i) === getProp(propName)(item) &&
      (
        R.prop('id')(i) !== R.prop('id')(item) || // TODO check where id is used
        R.prop('uuid')(i) !== R.prop('uuid')(item)
      )
    ,
    items
  )

  return hasDuplicates
    ? { key: errorKey }
    : null
}

const validateNotKeyword = errorKey => (propName, item) => {
  const value = getProp(propName)(item)
  return ValidatorNameKeywords.isKeyword(value)
    ? { key: errorKey, params: { value } }
    : null
}

const validateName = errorKey => (propName, item) => {
  const prop = getProp(propName)(item)
  return prop && !validNameRegex.test(prop)
    ? { key: errorKey }
    : null
}

const validatePositiveNumber = errorKey => (propName, item) => {
  const value = getProp(propName)(item)

  if (value && isNaN(value)) {
    return { key: ValidatorErrorKeys.invalidNumber }
  } else if (value && value <= 0) {
    return { key: errorKey }
  } else {
    return null
  }
}

module.exports = {
  validateRequired,
  validateItemPropUniqueness,
  validateNotKeyword,
  validateName,
  validatePositiveNumber,

  isKeyword: ValidatorNameKeywords.isKeyword
}
