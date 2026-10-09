import SystemError from '@core/systemError'

import { getAiEngineErrorView, getAiUnavailableActions } from '@webapp/ai/engines/engineUi'
import { isAiAbortError } from '@webapp/ai/runtime/runtimeErrors'

describe('getAiUnavailableActions', () => {
  test('one action per reason, in order, without duplicates', () => {
    expect(
      getAiUnavailableActions({
        reasons: ['localServerUnreachable', 'policyForbidsCloud', 'policyForbidsOrgHosted'],
        canChangePolicy: true,
      })
    ).toEqual(['retry', 'changePolicy'])
  })

  test('the policy action only for users who may change it', () => {
    expect(
      getAiUnavailableActions({ reasons: ['localServerNotEnabled', 'policyForbidsCloud'], canChangePolicy: false })
    ).toEqual(['turnOnLocalServer'])
  })

  test('no reasons, no actions', () => {
    expect(getAiUnavailableActions({ reasons: [], canChangePolicy: true })).toEqual([])
  })
})

describe('getAiEngineErrorView', () => {
  test('unreachable: retry and settings', () => {
    expect(
      getAiEngineErrorView(new SystemError('aiLocalServerUnreachable', { baseUrl: 'http://localhost:1234/v1' }))
    ).toEqual({
      retry: true,
      openSettings: true,
    })
  })

  test('found in the cause chain of an AI SDK error', () => {
    const wrapped = Object.assign(new Error('stream failed'), {
      cause: new SystemError('aiLocalServerModelMissing', {}),
    })
    expect(getAiEngineErrorView(wrapped)?.openSettings).toBe(true)
  })

  test('accepts a stored { key } error-like object', () => {
    expect(getAiEngineErrorView({ key: 'aiLocalServerUnreachable' })).toEqual({ retry: true, openSettings: true })
  })

  test('context exceeded: nothing to retry', () => {
    expect(getAiEngineErrorView(new SystemError('aiLocalServerContextExceeded', {}))).toEqual({
      retry: false,
      openSettings: false,
    })
  })

  test('no engine: retry after fixing the settings', () => {
    expect(
      getAiEngineErrorView(new SystemError('aiNoEngineAvailable', { reasons: [], dataClass: 'data' }))?.retry
    ).toBe(true)
  })

  test('other errors are not engine errors', () => {
    expect(getAiEngineErrorView(new SystemError('aiRequestTimeout', {}))).toBeNull()
    expect(getAiEngineErrorView(new Error('boom'))).toBeNull()
  })
})

describe('isAiAbortError', () => {
  test('closing the first-use dialog counts as a cancel', () => {
    expect(isAiAbortError(new SystemError('aiLocalServerConsentCancelled', {}))).toBe(true)
    expect(isAiAbortError(Object.assign(new Error('aborted'), { name: 'AbortError' }))).toBe(true)
    expect(isAiAbortError(new SystemError('aiLocalServerUnreachable', {}))).toBe(false)
  })
})
