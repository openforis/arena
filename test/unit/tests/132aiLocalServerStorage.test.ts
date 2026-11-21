import { DEFAULT_LOCAL_SERVER_BASE_URL } from '@webapp/ai/engines/localServerSettings'
import {
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
  test('the default URL is the LM Studio one', () => {
    expect(DEFAULT_LOCAL_SERVER_BASE_URL).toBe('http://localhost:1234/v1')
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
    expect(saveLocalServerConsent({ storage, ...base, surveyId: undefined, decision: 'accepted' })).toBe(true)
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1 })).toBe('accepted')
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
})
