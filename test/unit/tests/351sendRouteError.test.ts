import { SystemError as CoreSystemError } from '@openforis/arena-core'

import SystemError from '@core/systemError'

import { sendRouteError } from '@server/utils/sendRouteError'
import UnauthorizedError from '@server/utils/unauthorizedError'

import { createFakeResponse } from '@test/unit/utils/fakeExpress'

const unexpectedKey = 'appErrors:test.unexpected'

describe('sendRouteError (351)', () => {
  test('an application error keeps its status, key and params', () => {
    const res = createFakeResponse()
    sendRouteError({ res, error: new SystemError('appErrors:test.known', { a: 1 }, 409), unexpectedKey })
    expect(res.statusCode).toBe(409)
    expect(res.body).toMatchObject({ status: 'error', key: 'appErrors:test.known', params: { a: 1 } })
  })

  test('an error of arena-core keeps its key', () => {
    const res = createFakeResponse()
    sendRouteError({ res, error: new CoreSystemError('test.core', { b: 2 }), unexpectedKey })
    expect(res.body).toMatchObject({ status: 'error', key: 'test.core' })
  })

  test('an unauthorized error is a 403', () => {
    const res = createFakeResponse()
    sendRouteError({ res, error: new UnauthorizedError('someone'), unexpectedKey })
    expect(res.statusCode).toBe(403)
  })

  test('any other error is a 500 with the unexpected key; its text is logged, never sent', () => {
    const res = createFakeResponse()
    const logError = jest.fn()
    sendRouteError({
      res,
      error: new Error('relation "survey_7.record" does not exist'),
      unexpectedKey,
      context: 'test route',
      logError,
    })
    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ status: 'error', key: unexpectedKey, params: {} })
    expect(JSON.stringify(res.body)).not.toContain('relation')
    expect(logError).toHaveBeenCalledTimes(1)
    expect(logError.mock.calls[0][0]).toContain('test route')
    expect(logError.mock.calls[0][0]).toContain('relation "survey_7.record" does not exist')
  })

  test('a status code carried by the error is kept', () => {
    const res = createFakeResponse()
    sendRouteError({
      res,
      error: Object.assign(new Error('bad json'), { statusCode: 400 }),
      unexpectedKey,
      logError: jest.fn(),
    })
    expect(res.statusCode).toBe(400)
    expect(res.body.key).toBe(unexpectedKey)
  })

  describe('Retry-After', () => {
    test('a 429 carries the Retry-After header when the route gives a delay', () => {
      const res = createFakeResponse()
      sendRouteError({
        res,
        error: new SystemError('appErrors:test.busy', {}, 429),
        unexpectedKey,
        retryAfterSeconds: 5,
      })
      expect(res.statusCode).toBe(429)
      expect(res.headers['retry-after']).toBe('5')
    })

    test('other statuses and routes without a delay have no Retry-After', () => {
      const conflict = createFakeResponse()
      sendRouteError({
        res: conflict,
        error: new SystemError('appErrors:test.known', {}, 409),
        unexpectedKey,
        retryAfterSeconds: 5,
      })
      expect(conflict.headers['retry-after']).toBeUndefined()
      const noDelay = createFakeResponse()
      sendRouteError({ res: noDelay, error: new SystemError('appErrors:test.busy', {}, 429), unexpectedKey })
      expect(noDelay.headers['retry-after']).toBeUndefined()
    })
  })
})
