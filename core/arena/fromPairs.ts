import { _curry1 } from './internal/_curry1'

/**
 * Creates an object from an array of [key, value] pairs.
 *
 * @param {*} pairs - The array of [key, value] pairs.
 *
 * @returns {object} - The result.
 */
export const fromPairs = _curry1((pairs: any[]): any =>
  pairs.reduce((acc: any, pair: any[]) => {
    acc[pair[0]] = pair[1]
    return acc
  }, {})
)
