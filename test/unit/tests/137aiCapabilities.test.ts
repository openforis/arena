import {
  buildInstanceCapability,
  createCapabilitiesStore,
  emptyCapabilities,
  getCapabilitiesSnapshotForUser,
} from '@webapp/ai/engines/capabilities'
import type { LocalProvider } from '@webapp/ai/engines/localProviders'
import type { LocalServerProbeResult } from '@webapp/ai/engines/localServerProbe'
import type { AiCapabilities } from '@webapp/ai/engines/types'

const settingsSnapshot = {
  featuresEnabled: true,
  orgHostedBaseUrls: ['http://10.0.0.5:8000/v1'],
  policyCeilings: { schema: 'cloud' as const, data: 'cloud' as const },
  maxPromptChars: 1000,
  defaultProviderId: 'arena-default',
  adminDefault: { provider: 'openai', model: 'gateway-model', hostingClass: 'cloud' },
}

const desk: LocalProvider = {
  id: 'local:l1',
  name: 'Desk server',
  baseUrl: 'http://localhost:1234/v1',
  modelId: 'local-model',
}

const reachableProbe: LocalServerProbeResult = {
  reachable: true,
  models: ['local-model'],
  contextTokens: 4096,
  error: null,
}

/**
 * Returns store dependencies that record the settings loads and the probes.
 * @param {LocalProvider[]} localProviders - Local providers of this browser.
 * @param {LocalServerProbeResult} [probeResult] - Result of every probe.
 * @returns {object} `{ calls, deps }`.
 */
const fakeDeps = (localProviders: LocalProvider[], probeResult: LocalServerProbeResult = reachableProbe) => {
  const calls = { settings: [] as boolean[], probes: [] as string[] }
  const deps = {
    loadSettings: async ({ force }: { force: boolean; userUuid: string | null }) => {
      calls.settings.push(force)
      return settingsSnapshot
    },
    loadLocalProviders: () => localProviders,
    probe: async ({ baseUrl }: { baseUrl: string; modelId: string | null }) => {
      calls.probes.push(baseUrl)
      return probeResult
    },
  }
  return { calls, deps }
}

/** Returns the status of the Arena default entry. */
const arenaStatus = (capabilities: AiCapabilities) =>
  capabilities.providers.find((entry) => entry.id === 'arena-default')?.status

describe('builders', () => {
  test('instance: ceilings, allowlist and prompt cap, empty when unknown', () => {
    expect(buildInstanceCapability(settingsSnapshot)).toEqual({
      policyCeilings: { schema: 'cloud', data: 'cloud' },
      orgHostedBaseUrls: ['http://10.0.0.5:8000/v1'],
      maxPromptChars: 1000,
    })
    expect(buildInstanceCapability(null)).toEqual({ policyCeilings: null, orgHostedBaseUrls: [], maxPromptChars: null })
  })

  test('instance: partial ceilings get the defaults, garbled ones fail closed', () => {
    /** Builds the instance capability from the snapshot with the given ceilings. */
    const build = (policyCeilings: unknown) => buildInstanceCapability({ ...settingsSnapshot, policyCeilings } as never)
    expect(build({ schema: 'cloud' }).policyCeilings).toEqual({ schema: 'cloud', data: 'onDevice' })
    expect(build({ schema: 'bogus', data: 7 }).policyCeilings).toEqual({ schema: 'off', data: 'off' })
    expect(build('cloud').policyCeilings).toEqual({ schema: 'off', data: 'off' })
  })
})

describe('createCapabilitiesStore', () => {
  test('load probes each local provider once per session', async () => {
    const { calls, deps } = fakeDeps([desk])
    const store = createCapabilitiesStore(deps)
    const [first] = await Promise.all([store.load({ userUuid: 'u1' }), store.load({ userUuid: 'u1' })])
    await store.load({ userUuid: 'u1' })
    expect(calls.probes).toEqual(['http://localhost:1234/v1'])
    expect(first.local['local:l1']).toMatchObject({ reachable: true, hostingClass: 'onDevice' })
    expect(arenaStatus(first)).toBe('ready')
    expect(store.get()).toBe(first)
  })

  test('without local providers nothing is probed', async () => {
    const { calls, deps } = fakeDeps([])
    const capabilities = await createCapabilitiesStore(deps).load({ userUuid: 'u1' })
    expect(calls.probes).toEqual([])
    expect(capabilities.local).toEqual({})
    expect(capabilities.providers.map((entry) => entry.id)).toEqual(['arena-default'])
  })

  test('refresh reloads the settings and probes again; listeners are notified', async () => {
    const { calls, deps } = fakeDeps([desk])
    const store = createCapabilitiesStore(deps)
    let notified = 0
    const unsubscribe = store.subscribe(() => {
      notified += 1
    })
    await store.load({ userUuid: 'u1' })
    await store.refresh({ userUuid: 'u1' })
    expect(calls.probes.length).toBe(2)
    expect(calls.settings).toEqual([false, true])
    expect(notified).toBe(2)
    unsubscribe()
    store.notify()
    expect(notified).toBe(2)
  })

  test('another user reloads', async () => {
    const { calls, deps } = fakeDeps([desk])
    const store = createCapabilitiesStore(deps)
    await store.load({ userUuid: 'u1' })
    await store.load({ userUuid: 'u2' })
    expect(calls.probes.length).toBe(2)
  })

  test('an unreachable server keeps the probe error and is not available', async () => {
    const down: LocalServerProbeResult = {
      reachable: false,
      models: [],
      contextTokens: null,
      error: { key: 'aiLocalServerUnreachable', params: { baseUrl: 'http://localhost:1234/v1' } },
    }
    const { deps } = fakeDeps([desk], down)
    const capabilities = await createCapabilitiesStore(deps).load({ userUuid: 'u1' })
    expect(capabilities.local['local:l1'].reachable).toBe(false)
    expect(capabilities.local['local:l1'].error?.key).toBe('aiLocalServerUnreachable')
    expect(capabilities.providers.find((entry) => entry.id === 'local:l1')?.status).toBe('notAvailable')
  })

  test('the stored settings are exposed; there is no single local server reader', async () => {
    const { deps } = fakeDeps([desk])
    const store = createCapabilitiesStore(deps)
    await store.load({ userUuid: 'u1' })
    expect(store.getSettings()).toBe(settingsSnapshot)
    expect('getLocalSettings' in store).toBe(false)
  })
})

describe('user switch and failures', () => {
  /** Returns a promise and the function that resolves it. */
  const deferred = <T>() => {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((r) => {
      resolve = r
    })
    return { promise, resolve }
  }

  /** Returns a store whose successive probes wait for the given deferred results. */
  const storeWithProbes = (probes: Array<ReturnType<typeof deferred<LocalServerProbeResult>>>) => {
    let index = 0
    const { deps } = fakeDeps([desk])
    return createCapabilitiesStore({ ...deps, probe: () => probes[index++].promise })
  }

  test('another user sees empty capabilities while its load is pending, and after reset', async () => {
    const { deps } = fakeDeps([desk])
    const store = createCapabilitiesStore(deps)
    await store.load({ userUuid: 'u1' })
    expect(arenaStatus(store.get())).toBe('ready')
    const pending = store.load({ userUuid: 'u2' })
    expect(store.get()).toEqual(emptyCapabilities())
    expect(store.getSettings()).toBeNull()
    await pending
    expect(arenaStatus(store.get())).toBe('ready')
    store.reset()
    expect(store.get()).toEqual(emptyCapabilities())
  })

  test('a load for another user starts its own run; the late result of the first is discarded', async () => {
    const first = deferred<LocalServerProbeResult>()
    const second = deferred<LocalServerProbeResult>()
    const store = storeWithProbes([first, second])
    const loadU1 = store.load({ userUuid: 'u1' })
    const loadU2 = store.load({ userUuid: 'u2' })
    second.resolve({ ...reachableProbe, models: ['u2-model'] })
    await loadU2
    first.resolve({ ...reachableProbe, models: ['u1-model'] })
    await loadU1
    expect(store.get().local['local:l1'].models).toEqual(['u2-model'])
  })

  test('concurrent refreshes of the same user share one run', async () => {
    const first = deferred<LocalServerProbeResult>()
    const { calls, deps } = fakeDeps([desk])
    const store = createCapabilitiesStore({ ...deps, probe: () => first.promise })
    const a = store.refresh({ userUuid: 'u1' })
    const b = store.refresh({ userUuid: 'u1' })
    first.resolve(reachableProbe)
    await Promise.all([a, b])
    expect(calls.settings).toEqual([true])
  })

  test('a load overtaken by a refresh of the same user resolves with the newer result', async () => {
    const first = deferred<LocalServerProbeResult>()
    const second = deferred<LocalServerProbeResult>()
    const store = storeWithProbes([first, second])
    const loading = store.load({ userUuid: 'u1' })
    const refreshing = store.refresh({ userUuid: 'u1' })
    second.resolve({ ...reachableProbe, models: ['new'] })
    await refreshing
    first.resolve({ ...reachableProbe, models: ['old'] })
    expect((await loading).local['local:l1'].models).toEqual(['new'])
  })

  test('a load overtaken by a run of another user resolves with empty capabilities', async () => {
    const first = deferred<LocalServerProbeResult>()
    const second = deferred<LocalServerProbeResult>()
    const store = storeWithProbes([first, second])
    const loading = store.load({ userUuid: 'u1' })
    const other = store.load({ userUuid: 'u2' })
    second.resolve({ ...reachableProbe, models: ['u2-model'] })
    await other
    first.resolve(reachableProbe)
    expect((await loading).local).toEqual({})
  })

  test('a late stale probe does not overwrite a newer one', async () => {
    const old = deferred<LocalServerProbeResult>()
    const recent = deferred<LocalServerProbeResult>()
    const store = storeWithProbes([old, recent])
    const first = store.refresh({ userUuid: 'u1' })
    store.reset()
    const second = store.refresh({ userUuid: 'u1' })
    recent.resolve({ ...reachableProbe, models: ['new'] })
    await second
    old.resolve({ ...reachableProbe, models: ['old'] })
    await first
    expect(store.get().local['local:l1'].models).toEqual(['new'])
  })

  test('a failing dependency does not throw and gives the fallback state', async () => {
    const { deps } = fakeDeps([desk])
    const store = createCapabilitiesStore({
      ...deps,
      probe: async () => {
        throw new Error('boom')
      },
      loadSettings: async () => {
        throw new Error('boom')
      },
    })
    const capabilities = await store.load({ userUuid: 'u1' })
    expect(arenaStatus(capabilities)).toBe('notSetUp')
    expect(capabilities.local['local:l1'].reachable).toBeNull()
  })
})

describe('getCapabilitiesSnapshotForUser', () => {
  test('is a stable empty object for a different current user or nobody, the data for its owner', async () => {
    const { deps } = fakeDeps([desk])
    const store = createCapabilitiesStore(deps)
    expect(getCapabilitiesSnapshotForUser(store, null)).toBe(store.get())
    await store.load({ userUuid: 'u1' })
    expect(getCapabilitiesSnapshotForUser(store, 'u1')).toBe(store.get())
    const other = getCapabilitiesSnapshotForUser(store, 'u2')
    expect(other).toEqual(emptyCapabilities())
    expect(getCapabilitiesSnapshotForUser(store, null)).toBe(other)
    expect(getCapabilitiesSnapshotForUser(store, 'u2')).toBe(other)
  })
})
