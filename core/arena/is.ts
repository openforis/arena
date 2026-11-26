import { _curry2 } from './internal/_curry2'

/**
 * Checks if the value is an instance of the given constructor (or a primitive of that type).
 *
 * @param {*} Ctor - The constructor.
 */
export const is = _curry2(
  (Ctor: any, value: any): boolean =>
    (value !== null && value !== undefined && value.constructor === Ctor) || value instanceof Ctor
)
