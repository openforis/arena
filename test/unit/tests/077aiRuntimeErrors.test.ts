import SystemError from '@core/systemError'
import { getAiErrorKey, getAiErrorMessage, isAiAbortError } from '@webapp/ai/runtime/runtimeErrors'
import { runStreamWithCallbacks } from '@webapp/ai/runtime/streamCallbacks'

const i18n = { t: (key: string, params?: object) => `${key}${params ? JSON.stringify(params) : ''}` }

describe('runtime errors', () => {
  test('reads the key directly or through SDK wrappers', () => {
    const error = new SystemError('aiRateLimited', {}, 429)
    expect(getAiErrorKey(error)).toBe('aiRateLimited')
    expect(getAiErrorKey({ lastError: error })).toBe('aiRateLimited')
    expect(getAiErrorKey(Object.assign(new Error('x'), { cause: error }))).toBe('aiRateLimited')
    expect(getAiErrorKey(new Error('HTTP 401'))).toBeNull()
    expect(getAiErrorKey(new SystemError('appErrors:generic'))).toBeNull()
  })

  test('messages are always translated appErrors keys', () => {
    expect(getAiErrorMessage({ error: new SystemError('aiInputTooLong', { field: 'f', limit: 1 }), i18n })).toBe(
      'appErrors:aiInputTooLong{"field":"f","limit":1}'
    )
    expect(getAiErrorMessage({ error: new Error('<html>502</html>'), i18n })).toBe('appErrors:aiProviderUnavailable{}')
  })

  test('uses the appErrors key of an API error response before the generic fallback', () => {
    const apiError = Object.assign(new Error('403'), {
      response: { data: { key: 'appErrors:unauthorized', params: { user: 'u' } } },
    })
    expect(getAiErrorMessage({ error: apiError, i18n })).toBe('appErrors:unauthorized{"user":"u"}')
    const plainKey = Object.assign(new Error('x'), { response: { data: { key: 'surveyNotFound' } } })
    expect(getAiErrorMessage({ error: plainKey, i18n })).toBe('appErrors:surveyNotFound{}')
  })

  test('detects aborts', () => {
    expect(isAiAbortError(Object.assign(new Error('x'), { name: 'AbortError' }))).toBe(true)
    expect(isAiAbortError(new Error('x'))).toBe(false)
  })
})

describe('runStreamWithCallbacks', () => {
  test('calls onDone, or onError, but nothing after cancel', async () => {
    const events: string[] = []
    runStreamWithCallbacks({ run: async () => {}, onDone: () => events.push('done') })
    runStreamWithCallbacks({
      run: async () => {
        throw new Error('x')
      },
      onError: () => events.push('error'),
    })
    const cancel = runStreamWithCallbacks({
      run: (signal) =>
        new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))),
      onDone: () => events.push('late done'),
      onError: () => events.push('late error'),
    })
    cancel()
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(events.sort()).toEqual(['done', 'error'])
  })
})
