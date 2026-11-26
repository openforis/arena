import { _curry2 } from './internal/_curry2'

/**
 * Checks if no element satisfies the predicate.
 */
export const none = _curry2(
  (predicate: (value: any) => boolean, list: any[]): boolean => !list.some((item) => predicate(item))
)
