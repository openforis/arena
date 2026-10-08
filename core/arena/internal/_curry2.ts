import { _curry1 } from './_curry1'
import { _isPlaceholder } from './_isPlaceholder'

type AnyFn = (...args: any[]) => any

const _applyTwoArgs = ({ fn, f2, a, b }: { fn: AnyFn; f2: AnyFn; a: unknown; b: unknown }): any => {
  const aPlaceholder = _isPlaceholder(a)
  const bPlaceholder = _isPlaceholder(b)
  if (aPlaceholder && bPlaceholder) return f2
  if (aPlaceholder) return _curry1((_a) => fn(_a, b))
  if (bPlaceholder) return _curry1((_b) => fn(a, _b))
  return fn(a, b)
}

/**
 * Optimized internal two-arity curry function.
 *
 * @private
 * @param {Function} fn - The function to curry.
 * @returns {Function} The curried function.
 */
export const _curry2 = (fn: AnyFn) =>
  function f2(a?: unknown, b?: unknown): any {
    switch (arguments.length) {
      case 0:
        return f2

      case 1:
        return _isPlaceholder(a) ? f2 : _curry1((_b) => fn(a, _b))

      default:
        return _applyTwoArgs({ fn, f2, a, b })
    }
  }
