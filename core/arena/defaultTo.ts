import { _curry2 } from './internal/_curry2'

/**
 * Returns the default value if the input value is `null`, `undefined` or `NaN`, the input value otherwise.
 *
 * @param {*} defaultValue - The default value.
 * @param {*} value - The value to check.
 *
 * @returns {*} - The result.
 */
export const defaultTo = _curry2((defaultValue: any, value: any): any =>
  value === null || value === undefined || value !== value ? defaultValue : value
)
