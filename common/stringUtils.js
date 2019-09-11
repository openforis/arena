const R = require('ramda')

const nbsp = '\xA0'

const isString = R.is(String)

const trim = R.pipe(R.defaultTo(''), R.trim)

const leftTrim = R.replace(/^\s+/, '')

const toLower = R.pipe(trim, R.toLower)

const truncate = maxLength =>
  text =>
    text.length > maxLength ? text.substring(0, maxLength) + '...' : text

const contains = (value = '', string = '') => R.includes(toLower(value), toLower(string))

const isBlank = R.ifElse(
  isString,
  R.pipe(trim, R.isEmpty),
  R.isNil
)

const isNotBlank = R.pipe(isBlank, R.not)

const normalizeName = R.pipe(
  leftTrim,
  R.toLower,
  R.replace(/[^a-z0-9]/g, '_'),
  R.slice(0, 60),
)

const capitalizeFirstLetter = text => text.charAt(0).toUpperCase() + text.slice(1)

module.exports = {
  nbsp,

  trim,
  leftTrim,
  truncate,
  contains,

  isBlank,
  isNotBlank,

  isString,

  normalizeName,
  capitalizeFirstLetter,
}
