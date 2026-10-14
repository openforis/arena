import { buildLocalProviderCapability, createCapabilitiesStore } from '@webapp/ai/engines/capabilities'
import type { LocalProvider } from '@webapp/ai/engines/localProviders'
import type { LocalServerProbeResult } from '@webapp/ai/engines/localServerProbe'
import {
  type AiPublicProvider,
  buildProviderEntries,
  getAccountProviderStatus,
  getArenaDefaultEntry,
  getDefaultProviderId,
  getLocalProviderStatus,
} from '@webapp/ai/engines/providerEntries'
import type { AiLocalServerCapability } from '@webapp/ai/engines/types'

const account: AiPublicProvider = {
  id: 'acct:a1',
  type: 'anthropic',
  name: 'Work Claude',
  model: 'claude-x',
  baseUrl: null,
  hostingClass: 'cloud',
  hasApiKey: true,
  apiKeyReadable: true,
  lastTestOk: true,
  lastTestAt: '2026-10-14T00:00:00.000Z',
}

const laptop: LocalProvider = { id: 'local:l1', name: 'Laptop', baseUrl: 'http://localhost:1234/v1', modelId: 'm1' }
const lan: LocalProvider = { id: 'local:l2', name: 'Lab server', baseUrl: 'http://10.0.0.5:8000/v1', modelId: 'm2' }

/** Returns a reachable probe result listing the models. */
const reachable = (models: string[]): LocalServerProbeResult => ({
  reachable: true,
  models,
  contextTokens: 4096,
  error: null,
})

/** Returns a ready local capability with the overrides applied. */
const localCapability = (overrides: Partial<AiLocalServerCapability> = {}): AiLocalServerCapability => ({
  enabled: true,
  reachable: true,
  models: ['m1'],
  hostingClass: 'onDevice',
  contextTokens: 4096,
  baseUrl: 'http://localhost:1234/v1',
  modelId: 'm1',
  error: null,
  ...overrides,
})

const adminDefault = { provider: 'openai', model: 'gpt-x', hostingClass: 'cloud' }

describe('provider entries (266)', () => {
  test('account status: an unreadable key or a failed last test is notAvailable, a passed one ready, none notTested', () => {
    expect(getAccountProviderStatus(account)).toBe('ready')
    expect(getAccountProviderStatus({ ...account, apiKeyReadable: false })).toBe('notAvailable')
    expect(getAccountProviderStatus({ ...account, lastTestOk: false })).toBe('notAvailable')
    expect(getAccountProviderStatus({ ...account, lastTestOk: null })).toBe('notTested')
    // no key at all (mock, Vercel AI SDK): readability does not matter
    expect(getAccountProviderStatus({ ...account, hasApiKey: false, apiKeyReadable: false })).toBe('ready')
  })

  test('local status: not probed is notTested; unreachable, no model or a model the server lacks is notAvailable', () => {
    expect(getLocalProviderStatus(null)).toBe('notTested')
    expect(getLocalProviderStatus(localCapability({ reachable: null }))).toBe('notTested')
    expect(getLocalProviderStatus(localCapability())).toBe('ready')
    expect(getLocalProviderStatus(localCapability({ reachable: false }))).toBe('notAvailable')
    expect(getLocalProviderStatus(localCapability({ modelId: null }))).toBe('notAvailable')
    expect(getLocalProviderStatus(localCapability({ models: ['other'] }))).toBe('notAvailable')
  })

  test('Arena default: ready with the admin default, notSetUp without one', () => {
    expect(getArenaDefaultEntry(adminDefault)).toEqual({
      id: 'arena-default',
      kind: 'arenaDefault',
      type: 'openai',
      name: 'Arena default',
      model: 'gpt-x',
      baseUrl: null,
      hostingClass: 'cloud',
      status: 'ready',
    })
    expect(getArenaDefaultEntry(null)).toMatchObject({ type: 'arena-default', hostingClass: null, status: 'notSetUp' })
    expect(getArenaDefaultEntry({ ...adminDefault, hostingClass: 'bogus' })).toMatchObject({ status: 'notSetUp' })
  })

  test('entries: account providers, then local ones, Arena default last; invalid account entries are dropped', () => {
    const entries = buildProviderEntries({
      accountProviders: [account, { ...account, id: 'local:not-an-account' }, { ...account, id: 'acct:bad/id' }],
      localProviders: [laptop, lan],
      local: { [laptop.id]: localCapability() },
      adminDefault,
    })
    expect(entries.map((entry) => [entry.id, entry.kind, entry.status])).toEqual([
      ['acct:a1', 'account', 'ready'],
      ['local:l1', 'local', 'ready'],
      ['local:l2', 'local', 'notTested'],
      ['arena-default', 'arenaDefault', 'ready'],
    ])
    expect(entries[1]).toEqual({
      id: 'local:l1',
      kind: 'local',
      type: 'local',
      name: 'Laptop',
      model: 'm1',
      baseUrl: 'http://localhost:1234/v1',
      hostingClass: 'onDevice',
      status: 'ready',
    })
    expect(entries[0]).toMatchObject({
      type: 'anthropic',
      name: 'Work Claude',
      model: 'claude-x',
      hostingClass: 'cloud',
    })
  })

  test('default id: a valid stored id, else arena-default', () => {
    expect(getDefaultProviderId({ defaultProviderId: 'local:l1' })).toBe('local:l1')
    expect(getDefaultProviderId({ defaultProviderId: 'acct:a1' })).toBe('acct:a1')
    expect(getDefaultProviderId({ defaultProviderId: 'acct:../x' })).toBe('arena-default')
    expect(getDefaultProviderId({})).toBe('arena-default')
    expect(getDefaultProviderId(null)).toBe('arena-default')
  })

  test('local provider capability: hosting class from the URL and the allowlist, probe results', () => {
    expect(
      buildLocalProviderCapability({ provider: lan, probe: reachable(['m2']), allowlist: ['http://10.0.0.5:8000/v1'] })
    ).toEqual({
      enabled: true,
      reachable: true,
      models: ['m2'],
      hostingClass: 'orgHosted',
      contextTokens: 4096,
      baseUrl: 'http://10.0.0.5:8000/v1',
      modelId: 'm2',
      error: null,
    })
    expect(buildLocalProviderCapability({ provider: laptop, probe: null, allowlist: [] })).toMatchObject({
      reachable: null,
      models: [],
      hostingClass: 'onDevice',
    })
  })
})

describe('capabilities store with providers (266)', () => {
  /** Returns a promise and the function that resolves it. */
  const deferred = <T>() => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((r) => {
      resolve = r
    })
    return { promise, resolve }
  }

  test('probes every local provider at the same time and builds the entries', async () => {
    const pending = [deferred<LocalServerProbeResult>(), deferred<LocalServerProbeResult>()]
    const probed: string[] = []
    const store = createCapabilitiesStore({
      loadSettings: async () => ({ providers: [account], defaultProviderId: 'local:l2', adminDefault: null }),
      loadLocalProviders: () => [laptop, lan],
      // records the URL and answers when the test resolves that probe
      probe: ({ baseUrl }) => {
        probed.push(baseUrl)
        return pending[probed.length - 1].promise
      },
    })
    const loading = store.load({ userUuid: 'u1' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    // both probes started before either answered
    expect(probed).toEqual(['http://localhost:1234/v1', 'http://10.0.0.5:8000/v1'])
    pending[1].resolve({ reachable: false, models: [], contextTokens: null, error: null })
    pending[0].resolve(reachable(['m1']))
    const capabilities = await loading
    expect(capabilities.defaultProviderId).toBe('local:l2')
    expect(capabilities.providers.map((entry) => [entry.id, entry.status])).toEqual([
      ['acct:a1', 'ready'],
      ['local:l1', 'ready'],
      ['local:l2', 'notAvailable'],
      ['arena-default', 'notSetUp'],
    ])
    expect(capabilities.local['local:l1']).toMatchObject({ reachable: true, contextTokens: 4096 })
  })

  test('a failing provider loader or probe gives no local providers or a not tested one', async () => {
    const store = createCapabilitiesStore({
      loadSettings: async () => null,
      loadLocalProviders: () => {
        throw new Error('blocked')
      },
      probe: async () => reachable(['m1']),
    })
    const capabilities = await store.load({ userUuid: 'u1' })
    expect(capabilities.providers.map((entry) => entry.id)).toEqual(['arena-default'])
    expect(capabilities.defaultProviderId).toBe('arena-default')

    const failingProbe = createCapabilitiesStore({
      loadSettings: async () => null,
      loadLocalProviders: () => [laptop],
      probe: async () => {
        throw new Error('boom')
      },
    })
    expect((await failingProbe.load({ userUuid: 'u1' })).providers[0]).toMatchObject({
      id: 'local:l1',
      status: 'notTested',
    })
  })

  test('one failing probe does not cost the other provider its capability', async () => {
    const store = createCapabilitiesStore({
      loadSettings: async () => null,
      loadLocalProviders: () => [laptop, lan],
      probe: async ({ baseUrl }) => {
        if (baseUrl === laptop.baseUrl) throw new Error('boom')
        return reachable(['m2'])
      },
    })
    const capabilities = await store.load({ userUuid: 'u1' })
    expect(capabilities.providers.map((entry) => [entry.id, entry.status])).toEqual([
      ['local:l1', 'notTested'],
      ['local:l2', 'ready'],
      ['arena-default', 'notSetUp'],
    ])
    expect(capabilities.local['local:l2']).toMatchObject({ reachable: true, models: ['m2'] })
  })

  test('the settings loader gets the user of the run', async () => {
    const users: Array<string | null> = []
    const store = createCapabilitiesStore({
      loadSettings: async ({ userUuid }) => {
        users.push(userUuid)
        return null
      },
      loadLocalProviders: () => [],
      probe: async () => reachable([]),
    })
    await store.load({ userUuid: 'u1' })
    await store.refresh({ userUuid: 'u1' })
    expect(users).toEqual(['u1', 'u1'])
  })
})
