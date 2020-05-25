import * as R from 'ramda'
import BigNumber from 'bignumber.js'

BigNumber.config({
  ERRORS: false,
  FORMAT: {
    decimalSeparator: '.',
    groupSeparator: ' ',
    groupSize: 3,
  },
})

export const toNumber = (num) => (R.isNil(num) || R.isEmpty(num) ? NaN : Number(num))

export const isInteger = R.pipe(toNumber, Number.isInteger)

export const isFloat = R.pipe(toNumber, Number.isFinite)

/**
 * Formats the given value to the specified fixed dicimal digits.
 *
 * @param {number} value - The value to format.
 * @param {number} [decimalDigits=2] - Number of fixed decimal digits.
 * @returns {string} - The formatted value.
 */
export const formatDecimal = (value, decimalDigits = 2) => new BigNumber(value).toFormat(decimalDigits)

/**
 * Formats the given value to a rounded integer.
 *
 * @param {number} value - The value to format.
 * @returns {string} - The formatted value.
 */
export const formatInteger = (value) => formatDecimal(value, 0)
