import * as R from 'ramda'

export const nbsp = '\u00A0'

export const isString = R.is(String)

export const trim = R.pipe(R.defaultTo(''), R.trim)

export const leftTrim = R.replace(/^\s+/, '')

const toLower = R.pipe(trim, R.toLower)

export const truncate = maxLength => text =>
  text.length > maxLength ? text.slice(0, maxLength) + '...' : text

export const contains = (value = '', string = '') =>
  R.includes(toLower(value), toLower(string))

export const isBlank = R.ifElse(isString, R.pipe(trim, R.isEmpty), R.isNil)

export const isNotBlank = R.pipe(isBlank, R.not)

export const normalizeName = R.pipe(
  leftTrim,
  R.toLower,
  R.replace(/[^a-z0-9]/g, '_'),
  R.slice(0, 60),
)

export const capitalizeFirstLetter = text =>
  text.charAt(0).toUpperCase() + text.slice(1)

export const removeNewLines = R.when(
  isString,
  R.pipe(R.split(/\r\n|\r|\n/g), R.join(' ')),
)
