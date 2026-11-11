import { _curry2 } from './internal/_curry2'

/**
 * Creates a new object with the own properties of both objects (the left one wins on conflicts).
 *
 * @param {*} left - The object whose properties take precedence.
 * @param {*} right - The other object.
 *
 * @returns {object} - The result.
 */
export const mergeLeft = _curry2((left: any, right: any): any => ({ ...right, ...left }))
