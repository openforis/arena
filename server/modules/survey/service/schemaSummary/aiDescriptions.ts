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
 * @param {string[]} params.knownUuids - Uuids of the node defs of the export.
 * @returns {Record<string, string>} The descriptions.
 * @throws {SystemError} aiDescriptionsInvalid (400) for anything else than a map of known uuids to short strings.
 */
export const parseAiDescriptions = ({ raw, knownUuids }: { raw: unknown; knownUuids: string[] }) => {
  if (!isPlainObject(raw)) throw invalid('notAnObject')
  const entries = Object.entries(raw)
  if (entries.length > AiLimits.dataDictionaryMaxDescriptions) throw invalid('tooMany')
  const known = new Set(knownUuids)
  for (const [uuid, description] of entries) {
    if (!known.has(uuid)) throw invalid('unknownUuid')
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
