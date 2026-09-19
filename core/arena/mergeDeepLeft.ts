import { _curry2 } from './internal/_curry2'
import { _mergeDeep } from './internal/_mergeDeep'

/**
 * Deeply merges two objects (the left one wins on conflicts).
 *
 * @param {*} left - The object whose properties take precedence.
 * @param {*} right - The other object.
 *
 * @returns {object} - The result.
 */
export const mergeDeepLeft = _curry2((left: any, right: any): any => _mergeDeep(right, left))
