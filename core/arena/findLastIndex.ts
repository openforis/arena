import { _curry2 } from './internal/_curry2'

/**
 * Returns the index of the last element that satisfies the predicate (-1 if none).
 */
export const findLastIndex = _curry2((predicate: (value: any) => boolean, list: any[]): number => {
  for (let idx = list.length - 1; idx >= 0; idx--) {
    if (predicate(list[idx])) return idx
  }
  return -1
})
