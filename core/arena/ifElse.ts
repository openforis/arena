import { _curryN } from './internal/_curryN'

/**
 * Creates a function that calls `onTrue` or `onFalse` with its arguments depending on the result of `condition`.
 *
 * @param {*} condition - The predicate.
 * @param {*} onTrue - The function applied when the predicate is true.
 * @param {*} onFalse - The function applied when the predicate is false.
 *
 * @returns {Function} - The result.
 */
export const ifElse = (
  condition: (...args: any[]) => boolean,
  onTrue: (...args: any[]) => any,
  onFalse: (...args: any[]) => any
) =>
  _curryN(Math.max(condition.length, onTrue.length, onFalse.length), (...args: any[]): any =>
    condition(...args) ? onTrue(...args) : onFalse(...args)
  )
