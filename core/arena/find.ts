import { _curry2 } from './internal/_curry2'

/**
 * Returns the first element that satisfies the predicate.
 */
export const find = _curry2((predicate: (value: any) => boolean, list: any[]): any =>
  list.find((item) => predicate(item))
)
