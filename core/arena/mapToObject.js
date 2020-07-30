/**
 * Converts a Map object into a Javascript Object.
 *
 * @param {Map} map - The Map object.
 * @returns {object} - The object.
 */
export const mapToObject = (map) => {
  const obj = {}
  map.forEach((value, key) => {
    obj[key] = value
  })
  return obj
}
