/**
 * Validation of the AI descriptions sent with a schema summary export: they are generated in the browser, so the
 * server checks them like any other user input before writing them in the aiDescription column.
 */
import { AiLimits } from '@common/ai/limits'
import SystemError, { StatusCodes } from '@core/systemError'

/**
 * Builds the 400 error of an invalid body.
 * @param {string} reason - What is wrong (logged with the error, not shown).
 * @returns {SystemError} The error.
 */
const invalid = (reason: string): SystemError =>
  new SystemError('aiDescriptionsInvalid', { reason }, StatusCodes.BAD_REQUEST)

/**
 * Returns true for a plain object (not null, not an array).
 * @param {unknown} value - Value.
 * @returns {boolean} True for a plain object.
 */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Validates the map of AI descriptions by node def uuid.
 * @param {object} params - Parameters.
 * @param {unknown} params.raw - The aiDescriptions of the request.
 * @param {string[]|null} [params.knownUuids] - Uuids of the node defs of the export; null checks the shape only (the
 * uuids are then checked where the survey is loaded for the export, so it is loaded once).
 * @returns {Record<string, string>} The descriptions.
 * @throws {SystemError} aiDescriptionsInvalid (400) for anything else than a map of known uuids to short strings.
 */
export const parseAiDescriptions = ({ raw, knownUuids = null }: { raw: unknown; knownUuids?: string[] | null }) => {
  if (!isPlainObject(raw)) throw invalid('notAnObject')
  const entries = Object.entries(raw)
  if (entries.length > AiLimits.dataDictionaryMaxDescriptions) throw invalid('tooMany')
  const known = knownUuids ? new Set(knownUuids) : null
  for (const [uuid, description] of entries) {
    if (known && !known.has(uuid)) throw invalid('unknownUuid')
    if (typeof description !== 'string' || description.length > AiLimits.dataDictionaryMaxDescriptionChars) {
      throw invalid('description')
    }
  }
  return Object.fromEntries(entries) as Record<string, string>
}

/**
 * Validates the number of node defs the browser could not describe.
 * @param {unknown} raw - The aiDescriptionsFailedCount of the request (missing: 0).
 * @returns {number} The count.
 * @throws {SystemError} aiDescriptionsInvalid (400) when not a whole number between 0 and the cap.
 */
export const parseAiDescriptionsFailedCount = (raw: unknown): number => {
  if (raw === undefined || raw === null) return 0
  if (!Number.isInteger(raw)) throw invalid('failedCount')
  const count = raw as number
  if (count < 0 || count > AiLimits.dataDictionaryMaxDescriptions) throw invalid('failedCount')
  return count
}

/**
 * Rejects the body of a tab opened before the deploy: it asks for server-generated descriptions, which no longer
 * exist, and would otherwise get an export silently without the column.
 * @param {object} body - Request parameters.
 * @returns {void}
 * @throws {SystemError} aiIncludeAiDescriptionsRemoved (400) when the body has includeAiDescriptions.
 */
export const assertNoLegacyIncludeAiDescriptions = (body: Record<string, unknown>): void => {
  if (body && Object.hasOwn(body, 'includeAiDescriptions')) {
    throw new SystemError('aiIncludeAiDescriptionsRemoved', {}, StatusCodes.BAD_REQUEST)
  }
}

// a cell that starts with one of these is read as a formula by spreadsheet programs
const formulaStartPattern = /^[=+\-@\t\r]/

/**
 * Neutralises a text that a spreadsheet program would run as a formula (CSV injection), by prefixing a quote.
 * @param {string} text - The cell text.
 * @returns {string} The text, safe to write in a cell.
 */
export const neutraliseSpreadsheetFormula = (text: string): string =>
  formulaStartPattern.test(text) ? `'${text}` : text
