import { _curry3 } from './internal/_curry3'

/**
 * Makes an ascending comparator function out of a function that returns a value that can be compared with < and >.
 *
 * @param {*} fn - The function that maps a value to the comparable value.
 */
export const ascend = _curry3((fn: (value: any) => any, a: any, b: any): number => {
  const aa = fn(a)
  const bb = fn(b)
  if (aa < bb) return -1
  return aa > bb ? 1 : 0
})
