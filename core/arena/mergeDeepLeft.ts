import { _curry2 } from './internal/_curry2'
import { _mergeDeep } from './internal/_mergeDeep'

/**
 * Deeply merges two objects (the left one wins on conflicts).
 *
 * @param {*} primary - The object whose properties take precedence.
 * @param {*} secondary - The other object.
 *
 * @returns {object} - The result.
 */
export const mergeDeepLeft = _curry2((primary: any, secondary: any): any => _mergeDeep(secondary, primary))
