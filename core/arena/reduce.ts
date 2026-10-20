import { _curry3 } from './internal/_curry3'

/**
 * Reduces the list to a single value.
 *
 * @param {*} fn - The reducer, called with the accumulator and the element.
 * @param {*} initialValue - The initial accumulator.
 * @param {*} list - The array.
 *
 * @returns {*} - The result.
 */
export const reduce = _curry3((fn: (acc: any, item: any) => any, initialValue: any, list: any[]): any =>
  list.reduce((acc, item) => fn(acc, item), initialValue)
)
