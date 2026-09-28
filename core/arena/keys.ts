import { _curry1 } from './internal/_curry1'

/**
 * Returns the own enumerable property names of the object.
 *
 * @param {*} object - The object.
 *
 * @returns {string[]} - The result.
 */
export const keys = _curry1((object: any): string[] => (Object(object) === object ? Object.keys(object) : []))
