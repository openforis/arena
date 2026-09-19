import { _curry3 } from './internal/_curry3'

/**
 * Returns the elements of the list or string between the given indexes.
 *
 * @param {*} from - The start index (inclusive).
 * @param {*} to - The end index (exclusive).
 * @param {*} list - The array or string.
 *
 * @returns {*} - The result.
 */
export const slice = _curry3((from: number, to: number, list: any): any => list.slice(from, to))
