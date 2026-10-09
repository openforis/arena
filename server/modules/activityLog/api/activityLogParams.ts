import SystemError, { StatusCodes } from '@core/systemError'

const DEFAULT_LIMIT = 30
const MAX_LIMIT = 1000
const INVALID_PARAMS_KEY = 'invalidParams'

/**
 * Creates the error thrown for an invalid parameter.
 * @param {string} name - Parameter name.
 * @returns {SystemError} The error.
 */
const invalid = (name: string) => new SystemError(INVALID_PARAMS_KEY, { name }, StatusCodes.BAD_REQUEST)

/**
 * Parses an optional non-negative integer (digits only).
 * @param {unknown} value - Raw value.
 * @param {string} name - Parameter name.
 * @returns {?number} The number, or null when missing.
 */
const parsePositiveInt = (value: unknown, name: string): number | null => {
  if (value === undefined || value === null || value === '') return null
  const text = String(value)
  if (!/^\d+$/.test(text)) throw invalid(name)
  return Number(text)
}

/**
 * Validates the activity log fetch parameters (ids are interpolated in the SQL, so only digits pass).
 * @param {object} params - Request params.
 * @returns {{idGreaterThan: ?number, idLessThan: ?number, limit: number}} The parsed params.
 */
export const parseActivityLogFetchParams = (params: Record<string, unknown>) => {
  const limit = parsePositiveInt(params.limit, 'limit') ?? DEFAULT_LIMIT
  if (limit < 1 || limit > MAX_LIMIT) throw invalid('limit')
  return {
    idGreaterThan: parsePositiveInt(params.idGreaterThan, 'idGreaterThan'),
    idLessThan: parsePositiveInt(params.idLessThan, 'idLessThan'),
    limit,
  }
}
