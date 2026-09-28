import { _curry2 } from './internal/_curry2'

/**
 * Returns a copy of the list sorted by the value returned by the function.
 *
 * @param {*} fn - The function that maps a value to the comparable value.
 * @param {*} list - The array.
 *
 * @returns {Array} - The result.
 */
export const sortBy = _curry2((fn: (value: any) => any, list: any[]): any[] =>
  [...list].sort((a, b) => {
    const aa = fn(a)
    const bb = fn(b)
    if (aa < bb) return -1
    return aa > bb ? 1 : 0
  })
)
