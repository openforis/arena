import { _curry1 } from './internal/_curry1'

/**
 * Returns the own enumerable property values of the object.
 *
 * @param {*} object - The object.
 *
 * @returns {Array} - The result.
 */
export const values = _curry1((object: any): any[] => (Object(object) === object ? Object.values(object) : []))
