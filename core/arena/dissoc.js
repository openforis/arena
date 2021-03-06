import { _curry2 } from './internal/_curry2'

/**
 * Returns a new object that does not contain a `prop` property.
 *
 * @param {!string} prop - The name of the property to dissociate.
 * @param {!object} obj - The object to clone.
 * @returns {object} - The new object.
 */
export const dissoc = _curry2((prop, obj) => {
  const objUpdated = { ...obj }
  delete objUpdated[prop]
  return objUpdated
})
