import { _curry2 } from './internal/_curry2'
import { _equals } from './internal/_equals'

/**
 * Checks if two values are deeply equal.
 */
export const equals = _curry2((a: any, b: any): boolean => _equals(a, b))
