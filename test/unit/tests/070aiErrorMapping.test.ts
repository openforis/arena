import { APICallError } from '@ai-sdk/provider'

import SystemError from '@core/systemError'
import { formatErrorForLog, toAiSystemError, toAiWireError } from '@server/modules/ai/service/gateway/errorMapping'

const apiCallError = (statusCode?: number) =>
  new APICallError({
    message: `upstream ${statusCode}`,
    url: 'https://provider.example/v1/chat',
    requestBodyValues: {},
    statusCode,
    responseBody: '{"error":"secret upstream body"}',
  })

describe('toAiSystemError', () => {
  test.each([
    [401, 'aiProviderAuth', 502],
    [403, 'aiProviderAuth', 502],
    [429, 'aiProviderRateLimited', 429],
    [400, 'aiProviderRejected', 502],
    [404, 'aiProviderRejected', 502],
    [422, 'aiProviderRejected', 502],
    [500, 'aiProviderUnavailable', 502],
    [undefined, 'aiProviderUnavailable', 502],
  ])('upstream HTTP %p → %s (%p)', (statusCode, key, status) => {
    const error = toAiSystemError(apiCallError(statusCode))
    expect(error.key).toBe(key)
    expect(error.statusCode).toBe(status)
  })

  test('unwraps the retry error of the AI SDK', () => {
    const retryError = Object.assign(new Error('Failed after 3 attempts'), {
      errors: [apiCallError(500), apiCallError(429)],
      lastError: apiCallError(429),
    })
    expect(toAiSystemError(retryError).key).toBe('aiProviderRateLimited')
  })

  test('keeps SystemErrors as they are', () => {
    const original = new SystemError('aiPromptTooLarge', { size: 9, limit: 1 }, 413)
    expect(toAiSystemError(original)).toBe(original)
  })

  test('timeout wins over the abort error it causes', () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' })
    const error = toAiSystemError(abort, { timedOut: true })
    expect(error.key).toBe('aiRequestTimeout')
    expect(error.statusCode).toBe(504)
  })

  test('network errors are unavailable', () => {
    expect(toAiSystemError(new TypeError('fetch failed')).key).toBe('aiProviderUnavailable')
  })
})

describe('toAiWireError / formatErrorForLog', () => {
  test('the wire never carries the upstream body', () => {
    expect(toAiWireError(apiCallError(400))).toEqual({ key: 'aiProviderRejected', params: {} })
  })

  test('the log carries the upstream body and status', () => {
    const log = formatErrorForLog('chatbot', apiCallError(400))
    expect(log).toMatch(/chatbot/)
    expect(log).toMatch(/secret upstream body/)
    expect(log).toMatch(/statusCode: 400/)
  })
})
