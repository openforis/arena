import { _curry2 } from './internal/_curry2'

/**
 * Applies the function to every value of the object.
 *
 * @param {*} fn - The function called with the value, the key and the object.
 */
export const mapObjIndexed = _curry2((fn: (value: any, key: string, object: any) => any, object: any): any =>
  Object.keys(object).reduce((acc: any, key: string) => {
    acc[key] = fn(object[key], key, object)
    return acc
  }, {})
)
