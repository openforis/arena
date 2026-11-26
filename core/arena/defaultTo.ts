import { _curry2 } from './internal/_curry2'

/**
 * Returns the default value if the input value is `null`, `undefined` or `NaN`, the input value otherwise.
 */
export const defaultTo = _curry2((defaultValue: any, value: any): any =>
  value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value)) ? defaultValue : value
)
