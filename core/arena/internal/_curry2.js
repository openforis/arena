import { _curry1 } from './_curry1'
import { _isPlaceholder } from './_isPlaceholder'

/**
 * Optimized internal two-arity curry function.
 *
 * @private
 * @param {Function} fn - The function to curry.
 * @returns {Function} The curried function.
 */
export const _curry2 = (fn) =>
  function f2(a, b) {
    /* eslint-disable no-nested-ternary */
    switch (arguments.length) {
      case 0:
        return f2

      case 1:
        return _isPlaceholder(a) ? f2 : _curry1((_b) => fn(a, _b))

      default:
        return _isPlaceholder(a) && _isPlaceholder(b)
          ? f2
          : _isPlaceholder(a)
          ? _curry1((_a) => fn(_a, b))
          : _isPlaceholder(b)
          ? _curry1((_b) => fn(a, _b))
          : fn(a, b)
    }
  }
