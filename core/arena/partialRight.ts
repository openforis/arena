/**
 * Returns a function that calls `fn` with its own arguments followed by the given ones.
 *
 * @param {*} fn - The function to partially apply.
 * @param {*} args - The trailing arguments.
 *
 * @returns {Function} - The result.
 */
export const partialRight =
  (fn: (...args: any[]) => any, args: any[]) =>
  (...rest: any[]): any =>
    fn(...rest, ...args)
