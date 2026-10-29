const PNG_EXTENSION = '.png'
const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g)$/i
const MAX_BASE_LENGTH = 100
const DATE_SUFFIX_LENGTH = 11 // "_yyyy-mm-dd"
const FALLBACK_BASE = 'map'

/**
 * Pads a number to two digits.
 * @param {number} value - The number.
 * @returns {string} The padded number.
 */
const pad2 = (value: number): string => String(value).padStart(2, '0')

/**
 * Formats a date as yyyy-mm-dd in local time.
 * @param {Date} date - The date.
 * @returns {string} The formatted date.
 */
export const formatIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

/**
 * Keeps letters, digits, dots, dashes and underscores; other runs become "_", separators at the ends are dropped.
 * @param {string} text - The text.
 * @returns {string} The sanitized text (possibly empty).
 */
export const sanitizeFileNamePart = (text: string): string =>
  text
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}._-]+/gu, '_')
    .replace(/_+/g, '_')
    .replace(/^[._-]+/, '')
    .replace(/[._-]+$/, '')

/**
 * Cuts a text to a number of code points, never splitting a surrogate pair.
 * @param {string} text - The text.
 * @param {number} max - The max number of code points.
 * @returns {string} The cut text.
 */
const cutCodePoints = (text: string, max: number): string => Array.from(text).slice(0, max).join('')

/**
 * Normalizes a file name: sanitized, at most 100 characters before the extension, ending with the extension (an image
 * extension typed by the user is replaced).
 * @param {string} fileName - The file name, as typed by the user.
 * @param {string} [extension] - The extension of the image format, e.g. ".jpg".
 * @returns {string} The normalized file name, or an empty string when nothing valid is left.
 */
export const ensureImageFileName = (fileName: string, extension: string = PNG_EXTENSION): string => {
  const withoutExtension = (fileName ?? '').trim().replace(IMAGE_EXTENSION_REGEX, '')
  const base = sanitizeFileNamePart(cutCodePoints(sanitizeFileNamePart(withoutExtension), MAX_BASE_LENGTH))
  return base.length > 0 ? `${base}${extension}` : ''
}

/**
 * Builds the default file name of a screenshot from the plot entity name, the plot keys and the date.
 * @param {object} params - The parameters.
 * @param {string|null} [params.entityName] - Name of the plot entity definition.
 * @param {Array<unknown>} [params.keys] - Key values of the plot.
 * @param {Date} params.date - Date of the screenshot.
 * @param {string} [params.extension] - The extension of the image format.
 * @returns {string} The file name, e.g. "cluster_2_2026-10-11.png" or "map_2026-10-11.png".
 */
export const buildScreenshotFileName = ({
  entityName = null,
  keys = [],
  date,
  extension = PNG_EXTENSION,
}: {
  entityName?: string | null
  keys?: unknown[]
  date: Date
  extension?: string
}): string => {
  const parts = [entityName ?? '', ...keys.map((key) => (key === null || key === undefined ? '' : String(key)))]
    .map(sanitizeFileNamePart)
    .filter((part) => part.length > 0)
  const prefix = parts.length > 0 ? cutCodePoints(parts.join('_'), MAX_BASE_LENGTH - DATE_SUFFIX_LENGTH) : FALLBACK_BASE
  return ensureImageFileName(`${prefix}_${formatIsoDate(date)}`, extension)
}
