import { _curry2 } from './internal/_curry2'

/**
 * Returns the elements of the array (or entries of the object) that satisfy the predicate.
 *
 * @param {*} predicate - The predicate.
 * @param {*} filterable - The array or object to filter.
 *
 * @returns {*} - The result.
 */
export const filter = _curry2((predicate: (value: any) => boolean, filterable: any): any => {
  if (Array.isArray(filterable)) return filterable.filter((item) => predicate(item))
  return Object.keys(filterable).reduce((acc: any, key: string) => {
    if (predicate(filterable[key])) acc[key] = filterable[key]
    return acc
  }, {})
})
