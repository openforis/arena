import { _curry3 } from './internal/_curry3'

/**
 * Makes a shallow clone of an object, setting or overriding the specified
 * property with the given value. Note that this copies and flattens prototype
 * properties onto the new object as well. All non-primitive properties are
 * copied by reference.
 *
 * @param {!string} property - The name of the property to set.
 * @param {!any} value - The value to set.
 * @param {!object} object - The object to modify.
 *
 * @returns {object} - A new object equivalent to the original except for the changed property..
 */
export const assoc = _curry3((property, value, object) => ({
  ...object,
  [property]: value,
}))
