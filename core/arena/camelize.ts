import { _camelizePartial } from './internal/_camelizePartial'

/**
 * Recursively transform the keys of the specified object to camel-case.
 *
 * @param {!object} object - The object or value to transform.
 *
 * @returns {any} - The object with keys in camel case or the value in camel case.
 */
export function camelize(object: string): string
export function camelize(object: unknown): unknown
export function camelize(object: unknown): unknown {
  return _camelizePartial({}, object)
}
