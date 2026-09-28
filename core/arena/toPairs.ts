import { _curry1 } from './internal/_curry1'

/**
 * Converts the object into an array of [key, value] pairs.
 *
 * @param {*} object - The object.
 *
 * @returns {Array} - The result.
 */
export const toPairs = _curry1((object: any): any[] => Object.keys(object).map((key) => [key, object[key]]))
