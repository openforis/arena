import { createCapabilitiesStore } from '@webapp/ai/engines/capabilities'
import type { LocalProvider } from '@webapp/ai/engines/localProviders'
import type { LocalServerProbeResult } from '@webapp/ai/engines/localServerProbe'

const desk: LocalProvider = {
  id: 'local:l1',
  name: 'Desk server',
  baseUrl: 'http://localhost:1234/v1',
  modelId: 'local-model',
}

const reachable: LocalServerProbeResult = { reachable: true, models: ['local-model'], contextTokens: 4096, error: null }

const settingsWith = (overrides: Record<string, unknown> = {}) => ({
  featuresEnabled: true,
  featureToggles: { chat: true, expressions: true },
  accessLevel: 2,
  policyCeilings: { schema: 'cloud' as const, data: 'cloud' as const },
  defaultProviderId: 'arena-default',
  ...overrides,
})

/** Returns a store whose settings come from `next()`; `probes` lists the probed URLs. */
const setup = (next: () => Record<string, unknown> | null) => {
  const probes: string[] = []
  let settingsLoads = 0
  const store = createCapabilitiesStore({
    loadSettings: async () => {
      settingsLoads += 1
      return next() as never
    },
    loadLocalProviders: () => [desk],
    probe: async ({ baseUrl }) => {
      probes.push(baseUrl)
      return reachable
    },
  })
  return { store, probes, getSettingsLoads: () => settingsLoads }
}

describe('no local provider is probed while AI access is off (367)', () => {
  test('access level 0: nothing is probed, the provider is listed and not tested', async () => {
    const { store, probes } = setup(() => settingsWith({ accessLevel: 0 }))
    const capabilities = await store.load({ userUuid: 'u1' })
    expect(probes).toEqual([])
    expect(capabilities.local['local:l1'].reachable).toBeNull()
    expect(capabilities.providers.find((entry) => entry.id === 'local:l1')?.status).toBe('notTested')
  })

  test('the master switch off (a level that was never stored) counts as access 0', async () => {
    const { store, probes } = setup(() => settingsWith({ accessLevel: undefined, featuresEnabled: false }))
    await store.load({ userUuid: 'u1' })
    expect(probes).toEqual([])
  })

  test('access level 1 (Help only) probes', async () => {
    const { store, probes } = setup(() => settingsWith({ accessLevel: 1 }))
    await store.load({ userUuid: 'u1' })
    expect(probes).toEqual(['http://localhost:1234/v1'])
  })

  test('settings that could not be read: nothing is probed', async () => {
    const { store, probes } = setup(() => null)
    await store.load({ userUuid: 'u1' })
    expect(probes).toEqual([])
  })

  test('turning AI on later (refresh) probes', async () => {
    let level = 0
    const { store, probes } = setup(() => settingsWith({ accessLevel: level }))
    await store.load({ userUuid: 'u1' })
    level = 2
    const capabilities = await store.refresh({ userUuid: 'u1' })
    expect(probes).toEqual(['http://localhost:1234/v1'])
    expect(capabilities.local['local:l1'].reachable).toBe(true)
  })
})

describe('a failed settings load is retried by the next use (367)', () => {
  test('load() asks again after the settings could not be read, and keeps the result once it could', async () => {
    let answer: Record<string, unknown> | null = null
    const { store, probes, getSettingsLoads } = setup(() => answer)
    const first = await store.load({ userUuid: 'u1' })
    expect(first.instance.policyCeilings).toBeNull()
    expect(store.getLoadedFor()).toBe('u1')

    answer = settingsWith()
    const second = await store.load({ userUuid: 'u1' })
    expect(getSettingsLoads()).toBe(2)
    expect(second.instance.policyCeilings).toEqual({ schema: 'cloud', data: 'cloud' })
    expect(probes).toEqual(['http://localhost:1234/v1'])

    // read: kept for the session
    await store.load({ userUuid: 'u1' })
    expect(getSettingsLoads()).toBe(2)
  })

  test('concurrent loads of a failed read share one run', async () => {
    const { store, getSettingsLoads } = setup(() => null)
    await Promise.all([store.load({ userUuid: 'u1' }), store.load({ userUuid: 'u1' })])
    expect(getSettingsLoads()).toBe(1)
  })
})
