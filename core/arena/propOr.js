import { _curry3 } from './internal/_curry3'
import { prop } from './prop'

/**
 * Returns a function that when supplied an object returns the indicated
 * property of that object if it exists, otherwise the default value.
 *
 * @param {*} defaultValue - The default value.
 * @param {!string|number} property - The property name or array index.
 * @param {!object} object - The object to query.
 *
 * @returns {*} - The value at `object.property` or the default value.
 */
export const propOr = _curry3((defaultValue, property, object) => {
  const value = object ? prop(property, object) : null
  return value || defaultValue
})
