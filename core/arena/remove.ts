import { _curry3 } from './internal/_curry3'

/**
 * Returns a copy of the list without the given range of elements.
 *
 * @param {*} start - The start index.
 * @param {*} count - The number of elements to remove.
 * @param {*} list - The array.
 *
 * @returns {Array} - The result.
 */
export const remove = _curry3((start: number, count: number, list: any[]): any[] => [
  ...list.slice(0, start),
  ...list.slice(start + count),
])
