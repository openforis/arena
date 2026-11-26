import { _curry2 } from './internal/_curry2'

/**
 * Returns the given property value of every object in the list.
 *
 * @param {*} list - The array of objects.
 */
export const pluck = _curry2((property: PropertyKey, list: any[]): any[] => list.map((item) => item[property]))
