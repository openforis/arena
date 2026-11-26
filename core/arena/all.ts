import { _curry2 } from './internal/_curry2'

/**
 * Checks if all the elements satisfy the predicate.
 */
export const all = _curry2((predicate: (value: any) => boolean, list: any[]): boolean =>
  list.every((item) => predicate(item))
)
