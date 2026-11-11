import { _curry2 } from './internal/_curry2'

/**
 * Calls the function with every element of the list and returns the (same) list.
 *
 * @param {*} fn - The function to call with every element.
 * @param {*} list - The array.
 *
 * @returns {Array} - The result.
 */
export const forEach = _curry2((fn: (value: any) => void, list: any[]): any[] => {
  list.forEach((item) => fn(item))
  return list
})
