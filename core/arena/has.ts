import { _curry2 } from './internal/_curry2'

/**
 * Checks if the object has the given own property.
 *
 * @param {*} property - The property name.
 * @param {*} object - The object.
 *
 * @returns {boolean} - The result.
 */
export const has = _curry2(
  (property: PropertyKey, object: any): boolean =>
    object !== null && object !== undefined && Object.prototype.hasOwnProperty.call(object, property)
)
