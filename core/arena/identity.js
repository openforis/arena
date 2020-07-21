import { _curry1 } from './internal/_curry1'

/**
 * Returns the parameter supplied to it.
 *
 * @param {!any} x - The value to return.
 * @returns {any} The input value, `x`.
 */
export const identity = _curry1((x) => x)
