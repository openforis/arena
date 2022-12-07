import * as R from 'ramda'

import * as toSnakeCase from 'to-snake-case'

export { toSnakeCase }

export const NEW_LINE = '\r\n'

export const nbsp = '\u00A0'

export const isString = R.is(String)

export const trim = R.pipe(R.defaultTo(''), R.trim)

export const leftTrim = R.replace(/^\s+/, '')

export const padStart = (length, padString) => R.pipe(String, (s) => s.padStart(length, padString))

const toLower = R.pipe(trim, R.toLower)

export const truncate = (maxLength) => (text) => text.length > maxLength ? text.slice(0, maxLength) + '...' : text

export const contains = (value = '', string = '') => R.includes(toLower(value), toLower(string))

export const isBlank = R.ifElse(isString, R.pipe(trim, R.isEmpty), R.isNil)

export const isNotBlank = (value) => isString(value) && !isBlank(value)

/**
 * NormalizeName: Make an identifier suitable for use in various contexts.
 *
 * Postgres in particular has a limit of 63 bytes per identifier, so reserve 23 bytes for prefixes and suffixes.
 */
export const normalizeName = R.pipe(leftTrim, R.toLower, R.replace(/[^a-z0-9]/g, '_'), R.slice(0, 40))

export const capitalizeFirstLetter = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export const removeNewLines = (value) => {
  if (!isString(value)) return value
  return value.split(/\r\n|\r|\n/g).join(' ')
}

export const nullToEmpty = (value) => (value === null ? '' : value)

export const appendIfMissing = (suffix) => (text) => text.endsWith(suffix) ? text : `${text}${suffix}`
export const prependIfMissing = (prefix) => (text) => text.startsWith(prefix) ? text : `${prefix}${text}`
