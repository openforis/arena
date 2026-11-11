import { _curry2 } from './internal/_curry2'

/**
 * Returns a partial copy of the object containing only the given properties.
 *
 * @param {*} names - The property names to pick.
 * @param {*} object - The object.
 *
 * @returns {object} - The result.
 */
export const pick = _curry2((names: string[], object: any): any =>
  names.reduce((acc: any, name: string) => {
    if (name in object) acc[name] = object[name]
    return acc
  }, {})
)
