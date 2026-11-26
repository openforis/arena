import { _curry1 } from './internal/_curry1'

/**
 * A function that returns the boolean negation of its argument.
 */
export const not = _curry1((value: any): boolean => !value)
