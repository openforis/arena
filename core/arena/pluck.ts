import { _curry2 } from './internal/_curry2'

/**
 * Returns the given property value of every object in the list.
 *
 * @param {*} property - The property name.
 * @param {*} list - The array of objects.
 *
 * @returns {Array} - The result.
 */
export const pluck = _curry2((property: PropertyKey, list: any[]): any[] => list.map((item) => item[property]))
