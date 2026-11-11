import { _curry3 } from './internal/_curry3'

/**
 * Checks if the property value satisfies the predicate.
 *
 * @param {*} predicate - The predicate.
 * @param {*} property - The property name.
 * @param {*} object - The object.
 *
 * @returns {boolean} - The result.
 */
export const propSatisfies = _curry3(
  (predicate: (value: any) => boolean, property: PropertyKey, object: any): boolean => predicate(object[property])
)
