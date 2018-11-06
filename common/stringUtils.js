const R = require('ramda')

const trim = R.pipe(R.defaultTo(''), R.trim)

const leftTrim = R.replace(/^\s+/, '')

const isBlank = R.pipe(trim, R.isEmpty)

const isNotBlank = R.pipe(isBlank, R.not)

const isString = R.is(String)

const normalizeName = R.pipe(
  leftTrim,
  R.toLower,
  R.replace(/[^a-z0-9]/g, '_'),
  R.slice(0, 60),
)

module.exports = {
  trim,
  leftTrim,

  isBlank,
  isNotBlank,

  isString,

  normalizeName,
}
