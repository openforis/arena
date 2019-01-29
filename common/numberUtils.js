const R = require('ramda')

const toNumber = num => R.isNil(num) || R.isEmpty(num) ? NaN : Number(num)

const isInteger = R.pipe(toNumber, Number.isInteger)

const isFloat = R.pipe(toNumber, Number.isFinite)

module.exports = {
  toNumber,
  isFloat,
  isInteger,
}
