import { _curry1 } from './internal/_curry1'

/**
 * Merges a list of objects into a single one (later objects win on conflicts).
 *
 * @param {*} objects - The array of objects.
 *
 * @returns {object} - The result.
 */
export const mergeAll = _curry1((objects: any[]): any => Object.assign({}, ...objects))
