import { _curry3 } from './internal/_curry3'
import { assoc } from './assoc'
import { has } from './has'

const _assocPath = (pathArray: Array<string | number>, value: any, object: any): any => {
  if (pathArray.length === 0) return value
  const idx = pathArray[0]
  let newValue = value
  if (pathArray.length > 1) {
    const nextObject =
      object !== null && object !== undefined && has(idx, object)
        ? object[idx]
        : Number.isInteger(pathArray[1])
          ? []
          : {}
    newValue = _assocPath(pathArray.slice(1), value, nextObject)
  }
  return assoc(idx, newValue, object)
}

/**
 * Returns a clone of the object with the given path set to the given value (missing steps are created).
 *
 * @param {*} pathArray - The path (array of keys or indexes).
 * @param {*} value - The value to set.
 * @param {*} object - The object.
 *
 * @returns {object} - The result.
 */
export const assocPath = _curry3(_assocPath)
