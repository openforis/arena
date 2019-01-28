const R = require('ramda')

const toNumber = Number

const isInteger = R.pipe(toNumber, Number.isInteger)

const isFloat = R.pipe(toNumber, Number.isFinite)

module.exports = {
  isFloat,
  isInteger,
}
