import { _curry1 } from './_curry1'
import { _curry2 } from './_curry2'
import { _isPlaceholder } from './_isPlaceholder'

/**
 * Optimized internal three-arity curry function.
 *
 * @private
 * @param {Function} fn - The function to curry.
 * @returns {Function} The curried function.
 */
export const _curry3 = (fn) =>
  function f3(a, b, c) {
    /* eslint-disable no-nested-ternary */
    switch (arguments.length) {
      case 0:
        return f3

      case 1:
        return _isPlaceholder(a) ? f3 : _curry2((_b, _c) => fn(a, _b, _c))

      case 2:
        return _isPlaceholder(a) && _isPlaceholder(b)
          ? f3
          : _isPlaceholder(a)
          ? _curry2((_a, _c) => fn(_a, b, _c))
          : _isPlaceholder(b)
          ? _curry2((_b, _c) => fn(a, _b, _c))
          : _curry1((_c) => fn(a, b, _c))

      default:
        return _isPlaceholder(a) && _isPlaceholder(b) && _isPlaceholder(c)
          ? f3
          : _isPlaceholder(a) && _isPlaceholder(b)
          ? _curry2((_a, _b) => fn(_a, _b, c))
          : _isPlaceholder(a) && _isPlaceholder(c)
          ? _curry2((_a, _c) => fn(_a, b, _c))
          : _isPlaceholder(b) && _isPlaceholder(c)
          ? _curry2((_b, _c) => fn(a, _b, _c))
          : _isPlaceholder(a)
          ? _curry1((_a) => fn(_a, b, c))
          : _isPlaceholder(b)
          ? _curry1((_b) => fn(a, _b, c))
          : _isPlaceholder(c)
          ? _curry1((_c) => fn(a, b, _c))
          : fn(a, b, c)
    }
  }
