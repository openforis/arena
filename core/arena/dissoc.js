/**
 * Returns a new object that does not contain a `prop` property.
 *
 * @param {!string} prop - The prop to remove.
 * @returns {object} - The new object.
 */
export default (prop) => (obj) => {
  const objUpdated = { ...obj }
  delete objUpdated[prop]
  return objUpdated
}
