const typeOf = (value: any): string => Object.prototype.toString.call(value)

/**
 * Checks if two values are deeply equal.
 * Primitives are compared like `Object.is` (NaN equals NaN, +0 does not equal -0).
 *
 * @private
 * @param {*} a - The first value.
 * @param {*} b - The second value.
 * @returns {boolean} - True if the values are deeply equal.
 */
export const _equals = (a: any, b: any): boolean => {
  if (Object.is(a, b)) return true
  const type = typeOf(a)
  if (type !== typeOf(b)) return false
  if (a === null || b === null || (typeof a !== 'object' && typeof a !== 'function')) return false

  switch (type) {
    case '[object Date]':
      return Object.is(a.valueOf(), b.valueOf())
    case '[object RegExp]':
      return a.source === b.source && a.flags === b.flags
    case '[object Set]':
      return a.size === b.size && Array.from(a).every((item) => Array.from(b).some((other) => _equals(item, other)))
    case '[object Map]':
      return a.size === b.size && _equals(Array.from(a.entries()), Array.from(b.entries()))
    case '[object Function]':
      return false
    default:
  }
  if (Array.isArray(a) && a.length !== b.length) return false
  const keysA = Object.keys(a)
  if (keysA.length !== Object.keys(b).length) return false
  return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && _equals(a[key], b[key]))
}
