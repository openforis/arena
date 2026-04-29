import { _isPlaceholder } from './_isPlaceholder'

type AnyFn = (...args: unknown[]) => unknown

/**
 * Optimized internal one-arity curry function.
 *
 * @private
 * @param {Function} fn - The function to curry.
 * @returns {Function} The curried function.
 */
export const _curry1 = (fn: AnyFn) =>
  function f1(this: unknown, a?: unknown): unknown {
    return arguments.length === 0 || _isPlaceholder(a) ? f1 : fn.apply(this, arguments)
  }
