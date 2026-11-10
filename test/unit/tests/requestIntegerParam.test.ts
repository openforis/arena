import SystemError, { StatusCodes } from '@core/systemError'
import * as Request from '@server/utils/request'

/**
 * Creates a fake request with the specified query params.
 * @param {object} query - Query params.
 * @returns {object} The fake request.
 */
const mockReq = (query: Record<string, unknown>): any => ({ query, params: {}, body: {} })

/**
 * Returns the error thrown by the specified function, if any.
 * @param {Function} fn - Function to call.
 * @returns {any} The thrown error, or null.
 */
const getThrownError = (fn: () => unknown): any => {
  try {
    fn()
    return null
  } catch (error) {
    return error
  }
}

describe('Request.getIntegerParam', () => {
  it.each([
    ['12', 12],
    ['-3', -3],
    ['0', 0],
    [7, 7],
  ])('returns %p as the integer %p', (value, expected) => {
    expect(Request.getIntegerParam(mockReq({ id: value }), 'id')).toBe(expected)
  })

  it.each([undefined, null, ''])('returns null when the param value is %p', (value) => {
    expect(Request.getIntegerParam(mockReq({ id: value }), 'id')).toBeNull()
  })

  // values wrapped in arrays: it.each spreads array rows into arguments
  it.each([['abc'], ['1.5'], ['1e3'], ['0x10'], [' 1'], ['12abc'], ['true'], ['99999999999999999999'], [['1']], [1.5]])(
    'throws a bad request error when the param value is %p',
    (value) => {
      const error = getThrownError(() => Request.getIntegerParam(mockReq({ id: value }), 'id'))

      expect(error).toBeInstanceOf(SystemError)
      expect(error.key).toBe('appErrors:paramMustBeInteger')
      expect(error.params).toEqual({ param: 'id' })
      expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST)
    }
  )
})
