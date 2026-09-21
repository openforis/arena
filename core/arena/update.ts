import { _curry3 } from './internal/_curry3'

/**
 * Returns a copy of the list with the element at the given index replaced.
 *
 * @param {*} index - The index to replace.
 * @param {*} value - The new value.
 * @param {*} list - The array.
 *
 * @returns {Array} - The result.
 */
export const update = _curry3((index: number, value: any, list: any[]): any[] => {
  if (index >= list.length || index < -list.length) return list
  const idx = index < 0 ? list.length + index : index
  const result = [...list]
  result[idx] = value
  return result
})
