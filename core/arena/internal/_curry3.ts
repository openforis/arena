import { _curry1 } from './_curry1'
import { _curry2 } from './_curry2'
import { _isPlaceholder } from './_isPlaceholder'

type AnyFn = (...args: any[]) => any

const _applyTwoArgs = ({ fn, f3, a, b }: { fn: AnyFn; f3: AnyFn; a: unknown; b: unknown }): any => {
  const aPlaceholder = _isPlaceholder(a)
  const bPlaceholder = _isPlaceholder(b)
  if (aPlaceholder && bPlaceholder) return f3
  if (aPlaceholder) return _curry2((_a, _c) => fn(_a, b, _c))
  if (bPlaceholder) return _curry2((_b, _c) => fn(a, _b, _c))
  return _curry1((_c) => fn(a, b, _c))
}

const _applyThreeArgsWithTwoPlaceholders = ({
  fn,
  a,
  b,
  c,
  aPlaceholder,
  bPlaceholder,
}: {
  fn: AnyFn
  a: unknown
  b: unknown
  c: unknown
  aPlaceholder: boolean
  bPlaceholder: boolean
}): any => {
  if (aPlaceholder && bPlaceholder) return _curry2((_a, _b) => fn(_a, _b, c))
  if (aPlaceholder) return _curry2((_a, _c) => fn(_a, b, _c))
  return _curry2((_b, _c) => fn(a, _b, _c))
}

const _applyThreeArgs = ({ fn, f3, a, b, c }: { fn: AnyFn; f3: AnyFn; a: unknown; b: unknown; c: unknown }): any => {
  const aPlaceholder = _isPlaceholder(a)
  const bPlaceholder = _isPlaceholder(b)
  const cPlaceholder = _isPlaceholder(c)
  const placeholdersCount = [aPlaceholder, bPlaceholder, cPlaceholder].filter(Boolean).length
  if (placeholdersCount === 3) return f3
  if (placeholdersCount === 2) {
    return _applyThreeArgsWithTwoPlaceholders({ fn, a, b, c, aPlaceholder, bPlaceholder })
  }
  if (aPlaceholder) return _curry1((_a) => fn(_a, b, c))
  if (bPlaceholder) return _curry1((_b) => fn(a, _b, c))
  if (cPlaceholder) return _curry1((_c) => fn(a, b, _c))
  return fn(a, b, c)
}

/**
 * Optimized internal three-arity curry function.
 *
 * @private
 * @param {Function} fn - The function to curry.
 * @returns {Function} The curried function.
 */
export const _curry3 = (fn: AnyFn) =>
  function f3(a?: unknown, b?: unknown, c?: unknown): any {
    switch (arguments.length) {
      case 0:
        return f3

      case 1:
        return _isPlaceholder(a) ? f3 : _curry2((_b, _c) => fn(a, _b, _c))

      case 2:
        return _applyTwoArgs({ fn, f3, a, b })

      default:
        return _applyThreeArgs({ fn, f3, a, b, c })
    }
  }
