import { defaultTo } from './defaultTo'
import { _curry3 } from './internal/_curry3'
import { path } from './path'

/**
 * Retrieves the value at the given path, or the default value if it is missing.
 *
 * @param {*} pathArray - The path (array of keys or indexes).
 */
export const pathOr = _curry3((defaultValue: any, pathArray: Array<string | number>, object: any): any =>
  defaultTo(defaultValue, path(pathArray, object))
)
