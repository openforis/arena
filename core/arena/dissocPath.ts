import { _curry2 } from './internal/_curry2'
import { assoc } from './assoc'
import { dissoc } from './dissoc'
import { remove } from './remove'

const _dissocPath = (pathArray: Array<string | number>, object: any): any => {
  if (pathArray.length === 0) return object
  const [head, ...tail] = pathArray
  if (pathArray.length === 1) {
    return Number.isInteger(head) && Array.isArray(object) ? remove(head as number, 1, object) : dissoc(head, object)
  }
  if (object[head] === null || object[head] === undefined) return object
  if (Number.isInteger(pathArray[1]) && Array.isArray(object)) {
    const copy = [...object]
    copy[head as number] = _dissocPath(tail, copy[head as number])
    return copy
  }
  return assoc(head, _dissocPath(tail, object[head]), object)
}

/**
 * Returns a clone of the object without the value at the given path.
 *
 * @param {*} pathArray - The path (array of keys or indexes).
 * @param {*} object - The object.
 *
 * @returns {object} - The result.
 */
export const dissocPath = _curry2(_dissocPath)
