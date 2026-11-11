import { _curry3 } from './internal/_curry3'

/**
 * Makes a shallow clone of an object (or array), setting or overriding the specified
 * property with the given value. Note that this copies and flattens prototype
 * properties onto the new object as well. All non-primitive properties are
 * copied by reference.
 *
 * @param {!string} property - The name of the property to set (or the index, when the object is an array).
 * @param {!any} value - The value to set.
 * @param {!object} object - The object to modify.
 *
 * @returns {object} - A new object equivalent to the original except for the changed property.
 */
export const assoc = _curry3((property: PropertyKey, value: unknown, object: any): any => {
  if (Number.isInteger(property) && Array.isArray(object)) {
    const copy = [...object]
    copy[property as number] = value
    return copy
  }
  const result: any = {}

  for (const key in object) result[key] = object[key]
  result[property] = value
  return result
})
