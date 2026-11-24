import SystemError, { StatusCodes } from '@core/systemError'
import type { Response as ExpressResponse } from 'express'

import * as Response from '@server/utils/response'

// the parts of an express response used by Response.sendErr, recording what is sent
type MockResponse = {
  statusCode: number | null
  body: { key?: string; params?: Record<string, any> }
  status: (statusCode: number) => MockResponse
  json: (body: unknown) => MockResponse
}

const mockRes = () => {
  const res = { statusCode: null, body: null } as MockResponse
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
// Express stack, so next(error) never reaches it: the error key reaches the client (read as
// error.response.data.key by the webapp) through Response.sendErr, called by the routes or, for the
// system errors forwarded with next(error), by systemErrorMiddleware (registered after the routes).
describe('Response.sendErr', () => {
  it('preserves key, params and status code of a SystemError', () => {
    const res = mockRes()
    const error = new SystemError(
      'validationErrors:category.samplingPointDataCategoryAlreadyExists',
      { foo: 'bar' },
      StatusCodes.BAD_REQUEST
    )

    Response.sendErr(res as unknown as ExpressResponse, error)

    expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(res.body).toEqual({
      status: 'error',
      key: 'validationErrors:category.samplingPointDataCategoryAlreadyExists',
      params: { foo: 'bar' },
    })
  })

  it('falls back to a generic error for a plain Error', () => {
    const res = mockRes()

    Response.sendErr(res as unknown as ExpressResponse, new Error('some unexpected error'))

    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    expect(res.body.key).toBe('appErrors:generic')
  })

  it('does not throw when the error is null', () => {
    const res = mockRes()

    Response.sendErr(res as unknown as ExpressResponse, null)

    expect(res.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
    expect(res.body.params.text).toBe('Could not serve: null')
  })
})
