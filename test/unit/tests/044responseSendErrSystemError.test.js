import SystemError, { StatusCodes } from '@core/systemError'
import * as Response from '@server/utils/response'

const mockRes = () => {
  const res = { statusCode: null, body: null }
  res.status = (statusCode) => {
    res.statusCode = statusCode
    return res
  }
  res.json = (body) => {
    res.body = body
    return res
  }
  return res
}

// The error middleware installed by ArenaServer.init() is registered before the api routes in the
// Express stack, so next(error) never reaches it: routes that need a specific error key to reach the
// client (read as error.response.data.key by the webapp) must respond with Response.sendErr instead.
describe('Response.sendErr', () => {
  it('preserves key, params and status code of a SystemError', () => {
    const res = mockRes()
    const error = new SystemError(
      'validationErrors:category.samplingPointDataCategoryAlreadyExists',
      { foo: 'bar' },
      StatusCodes.BAD_REQUEST
    )

    Response.sendErr(res, error)

    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(res.body).toEqual({
      status: 'error',
      key: 'validationErrors:category.samplingPointDataCategoryAlreadyExists',
      params: { foo: 'bar' },
    })
  })

  it('falls back to a generic error for a plain Error', () => {
    const res = mockRes()

    Response.sendErr(res, new Error('some unexpected error'))

    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    expect(res.body.key).toBe('appErrors:generic')
  })
})
