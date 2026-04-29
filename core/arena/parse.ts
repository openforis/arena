import { isNull } from './isNull'
import { isEmpty } from './isEmpty'

/**
 * Converts a JavaScript Object Notation (JSON) string to a Javascript value.
 * It handles objects, arrays, Map, Set, String, Number.
 * It is the inverse of Stringify.
 *
 * @param {string!} string - The string.
 * @returns {*} - The value, a Javascript value.
 */
export const parse = (string: string | null | undefined): any => {
  if (isNull(string)) return null
  if (isEmpty(string)) return ''
  return JSON.parse(string, (_key, value: unknown) => {
    if (isNull(value)) return null
    if ((value as any).__type === 'Map') return new Map(parse((value as any).__values))
    if ((value as any).__type === 'Set') return new Set(parse((value as any).__values))
    return value
  })
}
