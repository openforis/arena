import { _isPlaceholder } from './_isPlaceholder'

/**
 * Optimized internal one-arity curry function.
 *
 * @private
 * @param {Function} fn - The function to curry.
 * @returns {Function} The curried function.
 */
export const _curry1 = (fn) =>
  function f1(a) {
    /* eslint-disable prefer-rest-params */
    return arguments.length === 0 || _isPlaceholder(a) ? f1 : fn.apply(this, arguments)
  }
