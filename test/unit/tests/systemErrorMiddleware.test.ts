import SystemError, { StatusCodes } from '@core/systemError'
import { systemErrorMiddleware } from '@server/system/systemErrorMiddleware'

const mockRes = (headersSent = false): any => {
  const res: any = { statusCode: null, body: null, headersSent }
  res.status = (statusCode: number) => {
    res.statusCode = statusCode
    return res
  }
  res.json = (body: unknown) => {
    res.body = body
    return res
  }
  return res
}

describe('systemErrorMiddleware', () => {
  it('sends a SystemError as JSON with its key, params and status code', () => {
    const res = mockRes()
    const next = jest.fn()
    const error = new SystemError('survey.dataMigrationInProgress', { surveyId: 1 }, StatusCodes.SERVICE_UNAVAILABLE)

    systemErrorMiddleware(error, {} as any, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(StatusCodes.SERVICE_UNAVAILABLE)
    expect(res.body).toEqual({ status: 'error', key: 'survey.dataMigrationInProgress', params: { surveyId: 1 } })
  })

  it('leaves the other errors to the next error handler', () => {
    const res = mockRes()
    const next = jest.fn()
    const error = new Error('unexpected')

    systemErrorMiddleware(error, {} as any, res, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(res.body).toBeNull()
  })

  it('leaves a SystemError to the next error handler when the response has already started', () => {
    const res = mockRes(true)
    const next = jest.fn()
    const error = new SystemError('survey.dataMigrationInProgress')

    systemErrorMiddleware(error, {} as any, res, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(res.body).toBeNull()
  })
})
