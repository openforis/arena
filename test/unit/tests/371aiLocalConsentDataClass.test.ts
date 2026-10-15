import {
  getLocalServerConsentKey,
  hasLocalServerConsent,
  loadLocalServerConsent,
  revokeLocalServerConsent,
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

const URL_A = 'http://localhost:1234/v1'
const URL_B = 'http://localhost:5678/v1'
const base = { userUuid: 'u1', baseUrl: URL_A }

describe('local consent per data class (371)', () => {
  test('a consent for the survey design does not cover record data', () => {
    const storage = memoryStorage()
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted', dataClass: 'schema' })
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1, dataClass: 'schema' })).toBe('accepted')
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1, dataClass: 'data' })).toBeNull()
  })

  test('a consent for record data covers the survey design too', () => {
    const storage = memoryStorage()
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted', dataClass: 'data' })
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1, dataClass: 'data' })).toBe('accepted')
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1, dataClass: 'schema' })).toBe('accepted')
  })

  test('without a data class, the survey design is meant', () => {
    const storage = memoryStorage()
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted' })
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1 })).toBe('accepted')
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1, dataClass: 'data' })).toBeNull()
  })

  test('an entry stored before the data class existed counts as the survey design: record data asks again', () => {
    const storage = memoryStorage()
    storage.setItem(getLocalServerConsentKey('u1'), JSON.stringify({ '1': { decision: 'accepted', baseUrl: URL_A } }))
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1, dataClass: 'schema' })).toBe('accepted')
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1, dataClass: 'data' })).toBeNull()
  })

  test('an unknown stored data class counts as the survey design', () => {
    const storage = memoryStorage()
    storage.setItem(
      getLocalServerConsentKey('u1'),
      JSON.stringify({ '1': { decision: 'accepted', baseUrl: URL_A, dataClass: 'everything' } })
    )
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1, dataClass: 'data' })).toBeNull()
  })

  test('saving the survey design never lowers a consent for record data of the same server', () => {
    const storage = memoryStorage()
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted', dataClass: 'data' })
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted', dataClass: 'schema' })
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1, dataClass: 'data' })).toBe('accepted')
  })

  test('saving the survey design then record data raises the consent', () => {
    const storage = memoryStorage()
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted', dataClass: 'schema' })
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted', dataClass: 'data' })
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1, dataClass: 'data' })).toBe('accepted')
  })

  test('a consent for another server is replaced, not raised', () => {
    const storage = memoryStorage()
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted', dataClass: 'data' })
    saveLocalServerConsent({ storage, ...base, baseUrl: URL_B, surveyId: 1, decision: 'accepted', dataClass: 'schema' })
    expect(loadLocalServerConsent({ storage, ...base, baseUrl: URL_B, surveyId: 1, dataClass: 'schema' })).toBe(
      'accepted'
    )
    expect(loadLocalServerConsent({ storage, ...base, baseUrl: URL_B, surveyId: 1, dataClass: 'data' })).toBeNull()
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1, dataClass: 'schema' })).toBeNull()
  })

  test('the surveys are independent', () => {
    const storage = memoryStorage()
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted', dataClass: 'data' })
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 2, dataClass: 'schema' })).toBeNull()
  })
})

describe('local consent can be revoked (371)', () => {
  test('revoking removes the consent of every survey for that server, and only that server', () => {
    const storage = memoryStorage()
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted', dataClass: 'data' })
    saveLocalServerConsent({ storage, ...base, surveyId: undefined, decision: 'accepted', dataClass: 'schema' })
    saveLocalServerConsent({ storage, ...base, baseUrl: URL_B, surveyId: 2, decision: 'accepted', dataClass: 'schema' })
    expect(revokeLocalServerConsent({ storage, ...base })).toBe(true)
    expect(loadLocalServerConsent({ storage, ...base, surveyId: 1, dataClass: 'schema' })).toBeNull()
    expect(loadLocalServerConsent({ storage, ...base, surveyId: undefined, dataClass: 'schema' })).toBeNull()
    expect(loadLocalServerConsent({ storage, ...base, baseUrl: URL_B, surveyId: 2, dataClass: 'schema' })).toBe(
      'accepted'
    )
  })

  test('revoking is per user', () => {
    const storage = memoryStorage()
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted' })
    saveLocalServerConsent({ storage, ...base, userUuid: 'u2', surveyId: 1, decision: 'accepted' })
    revokeLocalServerConsent({ storage, ...base })
    expect(loadLocalServerConsent({ storage, ...base, userUuid: 'u2', surveyId: 1 })).toBe('accepted')
  })

  test('hasLocalServerConsent tells whether an accepted consent is stored for the server', () => {
    const storage = memoryStorage()
    expect(hasLocalServerConsent({ storage, ...base })).toBe(false)
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'accepted', dataClass: 'schema' })
    expect(hasLocalServerConsent({ storage, ...base })).toBe(true)
    expect(hasLocalServerConsent({ storage, ...base, baseUrl: URL_B })).toBe(false)
    expect(hasLocalServerConsent({ storage, ...base, userUuid: 'u2' })).toBe(false)
    revokeLocalServerConsent({ storage, ...base })
    expect(hasLocalServerConsent({ storage, ...base })).toBe(false)
  })

  test('a declined entry is not a consent', () => {
    const storage = memoryStorage()
    saveLocalServerConsent({ storage, ...base, surveyId: 1, decision: 'declined' })
    expect(hasLocalServerConsent({ storage, ...base })).toBe(false)
  })

  test('without a user, a storage or a stored map nothing is revoked and nothing throws', () => {
    expect(revokeLocalServerConsent({ storage: null, ...base })).toBe(false)
    expect(revokeLocalServerConsent({ storage: memoryStorage(), ...base, userUuid: null })).toBe(false)
    expect(revokeLocalServerConsent({ storage: throwingStorage, ...base })).toBe(false)
    expect(hasLocalServerConsent({ storage: throwingStorage, ...base })).toBe(false)
    expect(hasLocalServerConsent({ storage: null, ...base })).toBe(false)
    expect(revokeLocalServerConsent({ storage: memoryStorage(), ...base })).toBe(true)
  })
})
