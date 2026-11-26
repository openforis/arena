import { _curry2 } from './internal/_curry2'

/**
 * Returns the larger of two values.
 */
export const max = _curry2((a: any, b: any): any => (b > a ? b : a))
