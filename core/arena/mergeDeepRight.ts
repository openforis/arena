import { _curry2 } from './internal/_curry2'
import { _mergeDeep } from './internal/_mergeDeep'

/**
 * Deeply merges two objects (the right one wins on conflicts).
 *
 * @param {*} left - The first object.
 * @param {*} right - The object whose properties take precedence.
 *
 * @returns {object} - The result.
 */
export const mergeDeepRight = _curry2((left: any, right: any): any => _mergeDeep(left, right))
