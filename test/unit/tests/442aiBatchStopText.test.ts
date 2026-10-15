import SystemError from '@core/systemError'

import { getBatchStopText } from '@webapp/components/ai/AiBatchProgressDialog/batchStopText'

import enAppErrorsModule from '@core/i18n/resources/en/appErrors'
import enCommon from '@core/i18n/resources/en/common'

const enAppErrors = enAppErrorsModule as unknown as Record<string, string>

// the real texts, with the {{param}} interpolation i18next does
const texts: Record<string, string> = {
  'aiBatch.stoppedCancelled': enCommon.aiBatch.stoppedCancelled,
  'aiBatch.stoppedError': enCommon.aiBatch.stoppedError,
  'appErrors:aiProviderAuth': enAppErrors.aiProviderAuth,
  'appErrors:aiProviderUnavailable': enAppErrors.aiProviderUnavailable,
}
const i18n = {
  t: (key: string, params: Record<string, unknown> = {}) =>
    (texts[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_match, name) => String(params[name] ?? '')),
}

describe('AI batch stop text (442)', () => {
  test('a cancelled run says where it stopped and that the results are kept', () => {
    const text = getBatchStopText({ stop: { cause: 'cancelled', done: 12, total: 40 }, i18n })
    expect(text).toContain('12 of 40')
    expect(text).toContain('kept')
  })

  test('a run that stopped on an error also says why, in the words of the AI errors', () => {
    const error = new SystemError('aiProviderAuth', {}, 502)
    const text = getBatchStopText({ stop: { cause: 'error', error, done: 39, total: 40 }, i18n })
    expect(text).toContain('39 of 40')
    expect(text).toContain(texts['appErrors:aiProviderAuth'])
    expect(text).toContain('kept')
  })

  test('an unknown error says the provider is unavailable, not "unknown"', () => {
    const text = getBatchStopText({ stop: { cause: 'error', error: new Error('boom'), done: 1, total: 2 }, i18n })
    expect(text).toContain(texts['appErrors:aiProviderUnavailable'])
    expect(text).not.toContain('boom')
  })

  test('the params are not HTML-escaped (the text is shown as is)', () => {
    const calls: Record<string, unknown>[] = []
    const spy = { t: (key: string, params: Record<string, unknown> = {}) => (calls.push(params), key) }
    getBatchStopText({ stop: { cause: 'cancelled', done: 1, total: 2 }, i18n: spy })
    expect(calls[0].interpolation).toEqual({ escapeValue: false })
  })
})
