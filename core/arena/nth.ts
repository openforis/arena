import { _curry2 } from './internal/_curry2'

/**
 * Returns the element at the given index of the list or string.
 *
 * @param {*} offset - The index (negative values count from the end).
 * @param {*} list - The array or string.
 *
 * @returns {*} - The result.
 */
export const nth = _curry2((offset: number, list: any): any => {
  if (list === null || list === undefined) return undefined
  const idx = offset < 0 ? list.length + offset : offset
  return typeof list === 'string' ? list.charAt(idx) : list[idx]
})
