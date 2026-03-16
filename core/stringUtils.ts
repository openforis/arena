import * as R from 'ramda'

import * as toSnakeCase from 'to-snake-case'

export { toSnakeCase }

export const NEW_LINE = '\r\n'
const NEW_LINE_REG_EX = /\r\n|\r|\n/g

export const nbsp = '\u00A0'

export const isString = R.is(String)

export const trim = R.pipe(R.defaultTo(''), R.trim)

export const leftTrim = R.replace(/^\s+/, '')

export const padStart =
  (length: number, padString: string) =>
  (s: unknown): string =>
    String(s).padStart(length, padString)

const toLower = R.pipe(trim, R.toLower)

/**
 * Truncates text to maxLength with ellipsis.
 */
export const truncate =
  (maxLength: number) =>
  (text: string): string =>
    text.length > maxLength ? text.slice(0, maxLength) + '...' : text

/**
 * Checks if value contains the string (case-insensitive).
 */
export const contains = (value: string = '', string: string = ''): boolean =>
  R.includes(toLower(value), toLower(string))

export const isBlank = R.ifElse(isString, R.pipe(trim, R.isEmpty), R.isNil)

export const isNotBlank = (value: unknown): value is string => isString(value) && !isBlank(value)

/**
 * NormalizeName: Make an identifier suitable for use in various contexts.
 *
 * Postgres in particular has a limit of 63 bytes per identifier, so reserve 23 bytes for prefixes and suffixes.
 */
export const normalizeName = R.pipe(leftTrim, R.toLower, R.replace(/[^a-z0-9]/g, '_'), R.slice(0, 40))

/**
 * Capitalize the first letter of a string.
 */
export const capitalizeFirstLetter = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

/**
 * Remove all newline characters from a string.
 */
export const removeNewLines = (value: unknown): unknown => {
  if (!isString(value)) return value
  return (value as string).replaceAll(NEW_LINE_REG_EX, ' ')
}

/**
 * Convert null or undefined to empty string.
 */
export const nullToEmpty = (value: unknown): string => (value === null || value === undefined ? '' : String(value))

/**
 * Append suffix if not already present.
 */
export const appendIfMissing =
  (suffix: string) =>
  (text: string): string =>
    text.endsWith(suffix) ? text : `${text}${suffix}`

/**
 * Prepend prefix if not already present.
 */
export const prependIfMissing =
  (prefix: string) =>
  (text: string): string =>
    text.startsWith(prefix) ? text : `${prefix}${text}`

/**
 * Remove prefix from text if present.
 */
export const removePrefix =
  (prefix: string) =>
  (text: unknown): string => {
    if (isBlank(text)) return String(text)
    const txt = String(text)
    return txt.startsWith(prefix) ? txt.substring(prefix.length) : txt
  }

/**
 * Remove suffix from text if present.
 */
export const removeSuffix =
  (suffix: string) =>
  (text: unknown): string => {
    if (isBlank(text)) return String(text)
    const txt = String(text)
    return txt.endsWith(suffix) ? txt.substring(0, txt.length - suffix.length) : txt
  }

/**
 * Quote text with single quotes.
 */
export const quote = (text: string): string => (isBlank(text) ? '' : `'${text}'`)

/**
 * Remove single quotes from beginning and end.
 */
export const unquote = R.pipe(removePrefix(`'`), removeSuffix(`'`))

/**
 * Remove double quotes from beginning and end.
 */
export const unquoteDouble = R.pipe(removePrefix(`"`), removeSuffix(`"`))

/**
 * Compute hash code for a string (base32 encoded 32-bit integer).
 */
export const hashCode = (str: unknown): string => {
  let hash = 0
  if (typeof str !== 'string' || str.length === 0) {
    return String(hash)
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // convert to 32bit integer
  }
  hash = hash >>> 0 // convert signed to unsigned https://stackoverflow.com/a/1908655
  return Number(hash).toString(32).toUpperCase() // make the hash small, convert base10 to base32
}
