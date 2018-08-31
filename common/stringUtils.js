const R = require('ramda')

const trim = R.pipe(R.defaultTo(''), R.trim)

const isBlank = R.pipe(trim, R.isEmpty)

const isNotBlank = R.pipe(isBlank, R.not)

module.exports = {
  trim,
  isBlank,
  isNotBlank,
}