import { _curry3 } from './internal/_curry3'
import { defaultTo } from './defaultTo'
import { path } from './path'

/**
 * Retrieves the value at the given path, or the default value if it is missing.
 *
 * @param {*} defaultValue - The default value.
 * @param {*} pathArray - The path (array of keys or indexes).
 * @param {*} object - The object.
 *
 * @returns {*} - The result.
 */
export const pathOr = _curry3((defaultValue: any, pathArray: Array<string | number>, object: any): any =>
  defaultTo(defaultValue, path(pathArray, object))
)
