import {
  getLocalProvidersKey,
  loadLocalProviders,
  type LocalProvider,
  normalizeLocalProviderBaseUrl,
  normalizeLocalProviders,
  saveLocalProviders,
} from '@webapp/ai/engines/localProviders'
import type { StorageLike } from '@webapp/ai/engines/types'

const NEW_KEY = 'arena.ai.localProviders.u1'

/** Creates an in-memory storage that exposes its data. */
const memoryStorage = (initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>(Object.entries(initial))
  return {
    data,
    /** Reads a key. */
    getItem: (key) => data.get(key) ?? null,
    /** Writes a key. */
    setItem: (key, value) => {
      data.set(key, String(value))
    },
  }
}

/** Creates a storage whose reads work and whose writes fail (quota or blocked storage). */
const readOnlyStorage = (initial: Record<string, string>): StorageLike & { data: Map<string, string> } => {
  const storage = memoryStorage(initial)
  return {
    ...storage,
    /** Fails like a full storage. */
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
  }
}

const legacyProvider: LocalProvider = {
  id: 'local:legacy',
  name: 'Local server',
  baseUrl: 'http://localhost:1234/v1',
  modelId: 'm1',
}

describe('local providers storage (265)', () => {
  test('the key is per user', () => {
    expect(getLocalProvidersKey('u1')).toBe(NEW_KEY)
  })

  test('base URLs: http(s) only, trimmed, without trailing slashes, at most 2048 chars', () => {
    expect(normalizeLocalProviderBaseUrl(' http://10.0.0.5:8000/v1// ')).toBe('http://10.0.0.5:8000/v1')
    expect(normalizeLocalProviderBaseUrl('https://llm.example.org/v1')).toBe('https://llm.example.org/v1')
    expect(normalizeLocalProviderBaseUrl('ftp://10.0.0.5/v1')).toBeNull()
    expect(normalizeLocalProviderBaseUrl('localhost:1234/v1')).toBeNull()
    expect(normalizeLocalProviderBaseUrl('not a url')).toBeNull()
    expect(normalizeLocalProviderBaseUrl(`http://h/${'a'.repeat(2048)}`)).toBeNull()
    expect(normalizeLocalProviderBaseUrl(42)).toBeNull()
  })

  test('normalize keeps valid entries, names them, drops invalid ids and duplicate ids, keeps an invalid address flagged', () => {
    expect(
      normalizeLocalProviders([
        { id: 'local:a', name: '  My   LM Studio ', baseUrl: 'http://localhost:1234/v1/', modelId: ' m ' },
        { id: 'local:b', name: '', baseUrl: 'http://10.0.0.5:8000/v1', modelId: '' },
        { id: 'local:a', name: 'duplicate', baseUrl: 'http://localhost:9999/v1', modelId: 'x' },
        { id: 'acct:c', name: 'account id', baseUrl: 'http://localhost:1/v1', modelId: 'x' },
        { id: 'local:bad/id', name: 'bad id', baseUrl: 'http://localhost:1/v1', modelId: 'x' },
        { id: 'local:d', name: 'bad url', baseUrl: 'javascript:alert(1)', modelId: 'x' },
        null,
        'text',
      ])
    ).toEqual([
      { id: 'local:a', name: 'My LM Studio', baseUrl: 'http://localhost:1234/v1', modelId: 'm' },
      { id: 'local:b', name: 'Local server', baseUrl: 'http://10.0.0.5:8000/v1', modelId: null },
      { id: 'local:d', name: 'bad url', baseUrl: 'javascript:alert(1)', modelId: 'x', addressInvalid: true },
    ])
    expect(normalizeLocalProviders({ id: 'local:a' })).toEqual([])
  })

  test('load: nothing stored, corrupt JSON, no storage, no user or a throwing storage give an empty list', () => {
    expect(loadLocalProviders({ storage: memoryStorage(), userUuid: 'u1' })).toEqual([])
    expect(loadLocalProviders({ storage: memoryStorage({ [NEW_KEY]: '{oops' }), userUuid: 'u1' })).toEqual([])
    expect(loadLocalProviders({ storage: null, userUuid: 'u1' })).toEqual([])
    expect(loadLocalProviders({ storage: memoryStorage(), userUuid: null })).toEqual([])
    const throwing = {
      /** Fails like a blocked storage. */
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => undefined,
    }
    expect(loadLocalProviders({ storage: throwing, userUuid: 'u1' })).toEqual([])
  })

  test('save then load round-trips per user; save reports a blocked storage', () => {
    const storage = memoryStorage()
    expect(saveLocalProviders({ storage, userUuid: 'u1', providers: [legacyProvider] })).toBe(true)
    expect(loadLocalProviders({ storage, userUuid: 'u1' })).toEqual([legacyProvider])
    expect(loadLocalProviders({ storage, userUuid: 'u2' })).toEqual([])
    expect(saveLocalProviders({ storage: readOnlyStorage({}), userUuid: 'u1', providers: [legacyProvider] })).toBe(
      false
    )
    expect(saveLocalProviders({ storage: null, userUuid: 'u1', providers: [] })).toBe(false)
  })
})
