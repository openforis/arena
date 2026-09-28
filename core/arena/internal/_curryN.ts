/**
 * Curries a function with the given arity (arguments collected until `length` are provided).
 *
 * @private
 * @param {number} length - The arity of the function.
 * @param {Function} fn - The function to curry.
 * @returns {Function} The curried function.
 */
export const _curryN = (length: number, fn: (...args: any[]) => any): ((...args: any[]) => any) => {
  const curried =
    (received: any[]) =>
    (...args: any[]): any => {
      const combined = [...received, ...args]
      return combined.length >= length ? fn(...combined) : curried(combined)
    }
  return length <= 1 ? (...args: any[]) => fn(...args) : curried([])
}
