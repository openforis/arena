import {
  convertLegacyLocalServer,
  getLocalProvidersKey,
  loadLocalProviders,
  loadSettingsWithLocalConversion,
  type LocalProvider,
  normalizeLocalProviderBaseUrl,
  normalizeLocalProviders,
  saveLocalProviders,
} from '@webapp/ai/engines/localProviders'
import type { RemovableStorage } from '@webapp/ai/engines/types'

const OLD_KEY = 'arena.ai.localServer.u1'
const NEW_KEY = 'arena.ai.localProviders.u1'

/** Creates an in-memory storage that exposes its data. */
const memoryStorage = (initial: Record<string, string> = {}): RemovableStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>(Object.entries(initial))
  return {
    data,
    /** Reads a key. */
    getItem: (key) => data.get(key) ?? null,
    /** Writes a key. */
    setItem: (key, value) => {
      data.set(key, String(value))
    },
    /** Removes a key. */
    removeItem: (key) => {
      data.delete(key)
    },
  }
}

/** Creates a storage whose reads work and whose writes fail (quota or blocked storage). */
const readOnlyStorage = (initial: Record<string, string>): RemovableStorage & { data: Map<string, string> } => {
  const storage = memoryStorage(initial)
  return {
    ...storage,
    /** Fails like a full storage. */
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
  }
}

/** Returns the JSON of old local server settings with overrides. */
const oldSettings = (values: Record<string, unknown>) =>
  JSON.stringify({ enabled: true, baseUrl: 'http://localhost:1234/v1', modelId: 'm1', preferLocal: true, ...values })

const legacyProvider: LocalProvider = {
  id: 'local:legacy',
  name: 'Local server',
  baseUrl: 'http://localhost:1234/v1',
  modelId: 'm1',
}

/** Returns the parsed provider list stored under the new key. */
const storedList = (storage: { data: Map<string, string> }) => JSON.parse(storage.data.get(NEW_KEY) ?? 'null')

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

  test('normalize keeps valid entries, names them, drops invalid ids and URLs and duplicate ids', () => {
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

describe('local server conversion (265)', () => {
  /** Runs the conversion for user u1 with defaults. */
  const run = (
    storage: RemovableStorage | null,
    {
      origin = 'converted',
      setDefault = jest.fn(async () => true),
    }: { origin?: 'converted' | 'user'; setDefault?: jest.Mock } = {}
  ) => convertLegacyLocalServer({ storage, userUuid: 'u1', defaultProviderOrigin: origin, setDefault })

  test('no old settings: nothing happens', async () => {
    const storage = memoryStorage()
    const setDefault = jest.fn(async () => true)
    expect(await run(storage, { setDefault })).toEqual({ status: 'none', defaultApplied: false })
    expect(storage.data.size).toBe(0)
    expect(setDefault).not.toHaveBeenCalled()
  })

  test('an old entry that was off, or corrupt, is only removed', async () => {
    for (const value of [oldSettings({ enabled: false }), '{oops']) {
      const storage = memoryStorage({ [OLD_KEY]: value })
      const setDefault = jest.fn(async () => true)
      expect(await run(storage, { setDefault })).toEqual({ status: 'none', defaultApplied: false })
      expect(storage.data.has(OLD_KEY)).toBe(false)
      expect(storage.data.has(NEW_KEY)).toBe(false)
      expect(setDefault).not.toHaveBeenCalled()
    }
  })

  test('on, preferLocal, origin converted: adds local:legacy, makes it the default, removes the old key', async () => {
    const storage = memoryStorage({ [OLD_KEY]: oldSettings({}) })
    const setDefault = jest.fn(async () => true)
    expect(await run(storage, { setDefault })).toEqual({ status: 'converted', defaultApplied: true })
    expect(storedList(storage)).toEqual([legacyProvider])
    expect(setDefault).toHaveBeenCalledWith('local:legacy')
    expect(storage.data.has(OLD_KEY)).toBe(false)
  })

  test('origin user: adds local:legacy without touching the default', async () => {
    const storage = memoryStorage({ [OLD_KEY]: oldSettings({}) })
    const setDefault = jest.fn(async () => true)
    expect(await run(storage, { origin: 'user', setDefault })).toEqual({ status: 'converted', defaultApplied: false })
    expect(storedList(storage)).toEqual([legacyProvider])
    expect(setDefault).not.toHaveBeenCalled()
    expect(storage.data.has(OLD_KEY)).toBe(false)
  })

  test('preferLocal false: adds local:legacy without touching the default', async () => {
    const storage = memoryStorage({ [OLD_KEY]: oldSettings({ preferLocal: false }) })
    const setDefault = jest.fn(async () => true)
    expect(await run(storage, { setDefault })).toEqual({ status: 'converted', defaultApplied: false })
    expect(setDefault).not.toHaveBeenCalled()
  })

  test('the server did not apply the default (the user picked one meanwhile): still converted', async () => {
    const storage = memoryStorage({ [OLD_KEY]: oldSettings({}) })
    expect(await run(storage, { setDefault: jest.fn(async () => false) })).toEqual({
      status: 'converted',
      defaultApplied: false,
    })
    expect(storage.data.has(OLD_KEY)).toBe(false)
  })

  test('a failed write keeps the old key and does not call the server', async () => {
    const storage = readOnlyStorage({ [OLD_KEY]: oldSettings({}) })
    const setDefault = jest.fn(async () => true)
    expect(await run(storage, { setDefault })).toEqual({ status: 'failed', defaultApplied: false })
    expect(storage.data.get(OLD_KEY)).toBe(oldSettings({}))
    expect(setDefault).not.toHaveBeenCalled()
  })

  test('a failed default call keeps the old key; the next run does not add local:legacy twice', async () => {
    const other: LocalProvider = {
      id: 'local:other',
      name: 'Other',
      baseUrl: 'http://localhost:8080/v1',
      modelId: null,
    }
    const storage = memoryStorage({ [OLD_KEY]: oldSettings({}), [NEW_KEY]: JSON.stringify([other]) })
    /** Fails like a network error. */
    const failing = jest.fn(async () => {
      throw new Error('network')
    })
    expect(await run(storage, { setDefault: failing })).toEqual({ status: 'failed', defaultApplied: false })
    expect(storage.data.has(OLD_KEY)).toBe(true)
    expect(storedList(storage)).toEqual([other, legacyProvider])

    const setDefault = jest.fn(async () => true)
    expect(await run(storage, { setDefault })).toEqual({ status: 'converted', defaultApplied: true })
    expect(storedList(storage)).toEqual([other, legacyProvider])
    expect(storage.data.has(OLD_KEY)).toBe(false)
  })

  test('a write that did not stick keeps the old key and does not call the server', async () => {
    const storage = memoryStorage({ [OLD_KEY]: oldSettings({}) })
    const lossy = { ...storage, setItem: () => undefined }
    const setDefault = jest.fn(async () => true)
    expect(await run(lossy, { setDefault })).toEqual({ status: 'failed', defaultApplied: false })
    expect(storage.data.has(OLD_KEY)).toBe(true)
    expect(setDefault).not.toHaveBeenCalled()
  })

  test('an old URL typed without a scheme is stored with http://', async () => {
    const storage = memoryStorage({ [OLD_KEY]: oldSettings({ baseUrl: 'localhost:1234/v1' }) })
    expect(await run(storage)).toEqual({ status: 'converted', defaultApplied: true })
    expect(storedList(storage)).toEqual([legacyProvider])
  })

  test('no storage or no user: nothing happens', async () => {
    expect(await run(null)).toEqual({ status: 'none', defaultApplied: false })
    expect(
      await convertLegacyLocalServer({
        storage: memoryStorage({ [OLD_KEY]: oldSettings({}) }),
        userUuid: null,
        defaultProviderOrigin: 'converted',
        setDefault: async () => true,
      })
    ).toEqual({ status: 'none', defaultApplied: false })
  })
})

describe('settings load with the local conversion (265)', () => {
  test('converts with the account origin, and loads the settings again when the default changed', async () => {
    const loadSettings = jest
      .fn()
      .mockResolvedValueOnce({ defaultProviderOrigin: 'converted', defaultProviderId: 'arena-default' })
      .mockResolvedValueOnce({ defaultProviderOrigin: 'converted', defaultProviderId: 'local:legacy' })
    const convert = jest.fn(async () => ({ status: 'converted' as const, defaultApplied: true }))
    const settings = await loadSettingsWithLocalConversion({ force: false, userUuid: 'u1', loadSettings, convert })
    expect(settings).toEqual({ defaultProviderOrigin: 'converted', defaultProviderId: 'local:legacy' })
    expect(convert).toHaveBeenCalledWith({ userUuid: 'u1', defaultProviderOrigin: 'converted' })
    expect(loadSettings.mock.calls).toEqual([[{ force: false }], [{ force: true }]])
  })

  test('no second load when the default did not change', async () => {
    const loadSettings = jest.fn(async () => ({ defaultProviderOrigin: 'user' }))
    const convert = jest.fn(async () => ({ status: 'converted' as const, defaultApplied: false }))
    await loadSettingsWithLocalConversion({ force: true, userUuid: 'u1', loadSettings, convert })
    expect(convert).toHaveBeenCalledWith({ userUuid: 'u1', defaultProviderOrigin: 'user' })
    expect(loadSettings).toHaveBeenCalledTimes(1)
  })

  test('no conversion without a user, or when the settings are missing or carry no origin (fetch failed)', async () => {
    const convert = jest.fn(async () => ({ status: 'none' as const, defaultApplied: false }))
    for (const [userUuid, settings] of [
      [null, { defaultProviderOrigin: 'converted' }],
      ['u1', null],
      ['u1', { featuresEnabled: false }],
    ] as const) {
      const loadSettings = jest.fn(async () => settings)
      expect(await loadSettingsWithLocalConversion({ force: false, userUuid, loadSettings, convert })).toBe(settings)
    }
    expect(convert).not.toHaveBeenCalled()
  })
})
