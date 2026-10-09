import {
  DEFAULT_LOCAL_SERVER_BASE_URL,
  defaultLocalServerSettings,
  getLocalServerSettingsKey,
  loadLocalServerSettings,
  normalizeLocalServerSettings,
  saveLocalServerSettings,
} from '@webapp/ai/engines/localServerSettings'
import {
  getEffectivePreferLocal,
  getLocalServerConsentKey,
  loadLocalServerConsent,
  saveLocalServerConsent,
} from '@webapp/ai/engines/localServerConsent'
import type { StorageLike } from '@webapp/ai/engines/types'

const memoryStorage = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, String(value))
    },
  }
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
}

describe('local server settings', () => {
  test('defaults: off, LM Studio URL, no model, prefer local', () => {
    expect(defaultLocalServerSettings()).toEqual({
      enabled: false,
      baseUrl: 'http://localhost:1234/v1',
      modelId: null,
      preferLocal: true,
    })
    expect(DEFAULT_LOCAL_SERVER_BASE_URL).toBe('http://localhost:1234/v1')
  })

  test('the key is per user', () => {
    expect(getLocalServerSettingsKey('u1')).toBe('arena.ai.localServer.u1')
  })

  test('normalize keeps valid values, trims the URL and its trailing slashes', () => {
    expect(
      normalizeLocalServerSettings({
        enabled: true,
        baseUrl: ' http://10.0.0.5:8000/v1// ',
        modelId: ' m ',
        preferLocal: false,
      })
    ).toEqual({ enabled: true, baseUrl: 'http://10.0.0.5:8000/v1', modelId: 'm', preferLocal: false })
  })

  test('normalize replaces invalid values with the defaults', () => {
    expect(normalizeLocalServerSettings({ enabled: 'yes', baseUrl: '', modelId: 42, preferLocal: 'no' })).toEqual(
      defaultLocalServerSettings()
    )
    expect(normalizeLocalServerSettings(null)).toEqual(defaultLocalServerSettings())
    expect(normalizeLocalServerSettings('x')).toEqual(defaultLocalServerSettings())
    expect(normalizeLocalServerSettings({ baseUrl: 'x'.repeat(3000) }).baseUrl).toBe(DEFAULT_LOCAL_SERVER_BASE_URL)
  })

  test('save then load round-trips per user', () => {
    const storage = memoryStorage()
    const settings = { enabled: true, baseUrl: 'http://localhost:1234/v1', modelId: 'local-model', preferLocal: true }
    expect(saveLocalServerSettings({ storage, userUuid: 'u1', settings })).toBe(true)
    expect(loadLocalServerSettings({ storage, userUuid: 'u1' })).toEqual(settings)
    expect(loadLocalServerSettings({ storage, userUuid: 'u2' })).toEqual(defaultLocalServerSettings())
  })

  test('corrupt JSON, missing storage or user and throwing storage give the defaults', () => {
    const storage = memoryStorage()
    storage.setItem('arena.ai.localServer.u1', '{not json')
    expect(loadLocalServerSettings({ storage, userUuid: 'u1' })).toEqual(defaultLocalServerSettings())
    expect(loadLocalServerSettings({ storage: null, userUuid: 'u1' })).toEqual(defaultLocalServerSettings())
    expect(loadLocalServerSettings({ storage, userUuid: null })).toEqual(defaultLocalServerSettings())
    expect(loadLocalServerSettings({ storage: throwingStorage, userUuid: 'u1' })).toEqual(defaultLocalServerSettings())
    expect(
      saveLocalServerSettings({ storage: throwingStorage, userUuid: 'u1', settings: defaultLocalServerSettings() })
    ).toBe(false)
    expect(saveLocalServerSettings({ storage: null, userUuid: 'u1', settings: defaultLocalServerSettings() })).toBe(
      false
    )
  })
})

describe('first-use consent', () => {
  const base = { userUuid: 'u1', baseUrl: 'http://localhost:1234/v1' }

  test('the key is per user', () => {
    expect(getLocalServerConsentKey('u1')).toBe('arena.ai.localServerConsent.u1')
  })

  test('is remembered per survey', () => {
    const storage = memoryStorage()
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1 })).toBeNull()
    expect(saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted' })).toBe(true)
    expect(saveLocalServerConsent({ storage, ...base, surveyId: 2, decision: 'declined' })).toBe(true)
    expect(saveLocalServerConsent({ storage, ...base, surveyId: undefined, decision: 'accepted' })).toBe(true)
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1 })).toBe('accepted')
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 2 })).toBe('declined')
    expect(loadLocalServerConsent({ storage, ...base, surveyId: undefined })).toBe('accepted')
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 3 })).toBeNull()
    expect(loadLocalServerConsent({ storage, ...base, userUuid: 'u2', surveyId: 1 })).toBeNull()
  })

  test('is asked again when the server URL changed', () => {
    const storage = memoryStorage()
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted' })
    expect(loadLocalServerConsent({ storage, ...base, baseUrl: 'http://localhost:1235/v1', surveyId: 1 })).toBeNull()
  })

  test('corrupt or unavailable storage means no decision', () => {
    const storage = memoryStorage()
    storage.setItem('arena.ai.localServerConsent.u1', '[1,2]')
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1 })).toBeNull()
    storage.setItem('arena.ai.localServerConsent.u1', '{"1":{"decision":"maybe","baseUrl":"http://localhost:1234/v1"}}')
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1 })).toBeNull()
    expect(loadLocalServerConsent({ storage: throwingStorage, ...base, surveyId: 1 })).toBeNull()
    expect(saveLocalServerConsent({ storage: throwingStorage, ...base, surveyId: 1, decision: 'accepted' })).toBe(false)
  })

  test('a decline turns the local preference off for that survey', () => {
    const settings = { ...defaultLocalServerSettings(), enabled: true }
    expect(getEffectivePreferLocal({ settings, consent: null })).toBe(true)
    expect(getEffectivePreferLocal({ settings, consent: 'accepted' })).toBe(true)
    expect(getEffectivePreferLocal({ settings, consent: 'declined' })).toBe(false)
    expect(getEffectivePreferLocal({ settings: { ...settings, preferLocal: false }, consent: 'accepted' })).toBe(false)
  })
})
