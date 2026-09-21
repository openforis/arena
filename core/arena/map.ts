import { _curry2 } from './internal/_curry2'

/**
 * Applies the function to every element of the array (or value of the object).
 *
 * @param {*} fn - The mapping function.
 * @param {*} functor - The array or object to map.
 *
 * @returns {*} - The result.
 */
export const map = _curry2((fn: (value: any) => any, functor: any): any => {
  if (Array.isArray(functor)) return functor.map((item) => fn(item))
  if (typeof functor === 'function') return (...args: any[]) => fn(functor(...args))
  return Object.keys(functor).reduce((acc: any, key: string) => {
    acc[key] = fn(functor[key])
    return acc
  }, {})
})
