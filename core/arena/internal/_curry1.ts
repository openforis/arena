import { _isPlaceholder } from './_isPlaceholder'

type AnyFn = (...args: any[]) => any

/**
 * Optimized internal one-arity curry function.
 *
 * @private
 * @returns {Function} The curried function.
 */
export const _curry1 = (fn: AnyFn) =>
  function f1(this: unknown, a?: unknown): any {
    return arguments.length === 0 || _isPlaceholder(a) ? f1 : fn.apply(this, arguments)
  }
