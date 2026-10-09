import {
  buildGatewayCapability,
  buildInstanceCapability,
  buildLocalServerCapability,
  createCapabilitiesStore,
  detectDeviceCapabilities,
  emptyCapabilities,
} from '@webapp/ai/engines/capabilities'
import { defaultLocalServerSettings } from '@webapp/ai/engines/localServerSettings'
import type { LocalServerProbeResult } from '@webapp/ai/engines/localServerProbe'
import type { AiLocalServerSettings } from '@webapp/ai/engines/types'

const settingsSnapshot = {
  featuresEnabled: true,
  effectiveSource: 'admin-default',
  effectiveProvider: 'openai',
  effectiveModel: 'gateway-model',
  hostingClass: 'cloud' as const,
  orgHostedBaseUrls: ['http://10.0.0.5:8000/v1'],
  policyCeilings: { schema: 'cloud' as const, data: 'cloud' as const },
  maxPromptChars: 1000,
}

const reachableProbe: LocalServerProbeResult = { reachable: true, models: ['local-model'], contextTokens: 4096, error: null }

const fakeDeps = (localSettings: AiLocalServerSettings, probeResult: LocalServerProbeResult = reachableProbe) => {
  const calls = { settings: [] as boolean[], probes: [] as string[], device: 0 }
  const deps = {
    loadSettings: async ({ force }: { force: boolean }) => {
      calls.settings.push(force)
      return settingsSnapshot
    },
    loadLocalSettings: () => localSettings,
    probe: async ({ baseUrl }: { baseUrl: string; modelId: string | null }) => {
      calls.probes.push(baseUrl)
      return probeResult
    },
    detectDevice: async () => {
      calls.device += 1
      return { webGpu: true, deviceMemoryGb: 8, promptApi: 'available' }
    },
  }
  return { calls, deps }
}

const enabledLocal: AiLocalServerSettings = { ...defaultLocalServerSettings(), enabled: true, modelId: 'local-model' }

describe('builders', () => {
  test('gateway: available only with an effective source and a hosting class', () => {
    expect(buildGatewayCapability(settingsSnapshot)).toEqual({
      available: true,
      hostingClass: 'cloud',
      provider: 'openai',
      model: 'gateway-model',
      maxPromptChars: 1000,
    })
    expect(buildGatewayCapability({ ...settingsSnapshot, effectiveSource: null }).available).toBe(false)
    expect(buildGatewayCapability({ ...settingsSnapshot, hostingClass: null }).available).toBe(false)
    expect(buildGatewayCapability(null)).toEqual({
      available: false,
      hostingClass: null,
      provider: null,
      model: null,
      maxPromptChars: null,
    })
  })

  test('instance: ceilings and allowlist, empty when unknown', () => {
    expect(buildInstanceCapability(settingsSnapshot)).toEqual({
      policyCeilings: { schema: 'cloud', data: 'cloud' },
      orgHostedBaseUrls: ['http://10.0.0.5:8000/v1'],
    })
    expect(buildInstanceCapability(null)).toEqual({ policyCeilings: null, orgHostedBaseUrls: [] })
  })

  test('local server: class from the URL and the allowlist, probe results', () => {
    const local = buildLocalServerCapability({
      localSettings: { ...enabledLocal, baseUrl: 'http://10.0.0.5:8000/v1' },
      probe: reachableProbe,
      allowlist: ['http://10.0.0.5:8000/v1'],
    })
    expect(local).toEqual({
      enabled: true,
      reachable: true,
      models: ['local-model'],
      hostingClass: 'orgHosted',
      contextTokens: 4096,
      baseUrl: 'http://10.0.0.5:8000/v1',
      modelId: 'local-model',
      error: null,
    })
    const off = buildLocalServerCapability({ localSettings: defaultLocalServerSettings(), probe: null, allowlist: [] })
    expect(off.enabled).toBe(false)
    expect(off.reachable).toBeNull()
  })
})

describe('createCapabilitiesStore', () => {
  test('load probes an enabled local server once per session', async () => {
    const { calls, deps } = fakeDeps(enabledLocal)
    const store = createCapabilitiesStore(deps)
    const [first] = await Promise.all([store.load({ userUuid: 'u1' }), store.load({ userUuid: 'u1' })])
    await store.load({ userUuid: 'u1' })
    expect(calls.probes).toEqual(['http://localhost:1234/v1'])
    expect(first.localServer.reachable).toBe(true)
    expect(first.localServer.hostingClass).toBe('onDevice')
    expect(first.gateway.available).toBe(true)
    expect(store.get()).toBe(first)
  })

  test('a disabled local server is never probed', async () => {
    const { calls, deps } = fakeDeps(defaultLocalServerSettings())
    const store = createCapabilitiesStore(deps)
    const capabilities = await store.load({ userUuid: 'u1' })
    expect(calls.probes).toEqual([])
    expect(capabilities.localServer.enabled).toBe(false)
  })

  test('refresh reloads the settings and probes again; listeners are notified', async () => {
    const { calls, deps } = fakeDeps(enabledLocal)
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
    const { calls, deps } = fakeDeps(enabledLocal)
    const store = createCapabilitiesStore(deps)
    await store.load({ userUuid: 'u1' })
    await store.load({ userUuid: 'u2' })
    expect(calls.probes.length).toBe(2)
  })

  test('an unreachable server keeps the probe error', async () => {
    const down: LocalServerProbeResult = {
      reachable: false,
      models: [],
      contextTokens: null,
      error: { key: 'aiLocalServerUnreachable', params: { baseUrl: 'http://localhost:1234/v1' } },
    }
    const { deps } = fakeDeps(enabledLocal, down)
    const store = createCapabilitiesStore(deps)
    const capabilities = await store.load({ userUuid: 'u1' })
    expect(capabilities.localServer.reachable).toBe(false)
    expect(capabilities.localServer.error?.key).toBe('aiLocalServerUnreachable')
  })

  test('device facts are read only on demand', async () => {
    const { calls, deps } = fakeDeps(enabledLocal)
    const store = createCapabilitiesStore(deps)
    await store.load({ userUuid: 'u1' })
    expect(calls.device).toBe(0)
    expect(store.get().device).toEqual(emptyCapabilities().device)
    await store.detectDevice()
    expect(store.get().device).toEqual({ webGpu: true, deviceMemoryGb: 8, promptApi: 'available' })
  })

  test('the stored settings are exposed', async () => {
    const { deps } = fakeDeps(enabledLocal)
    const store = createCapabilitiesStore(deps)
    await store.load({ userUuid: 'u1' })
    expect(store.getSettings()).toBe(settingsSnapshot)
    expect(store.getLocalSettings()).toBe(enabledLocal)
  })
})

describe('detectDeviceCapabilities', () => {
  test('reads WebGPU, memory and the Prompt API', async () => {
    const device = await detectDeviceCapabilities({
      navigatorLike: { gpu: { requestAdapter: async () => ({}) }, deviceMemory: 4 },
      languageModel: { availability: async () => 'downloadable' },
    })
    expect(device).toEqual({ webGpu: true, deviceMemoryGb: 4, promptApi: 'downloadable' })
  })

  test('missing or failing APIs give the safe values', async () => {
    expect(await detectDeviceCapabilities({ navigatorLike: {}, languageModel: undefined })).toEqual({
      webGpu: false,
      deviceMemoryGb: null,
      promptApi: null,
    })
    const failing = await detectDeviceCapabilities({
      navigatorLike: {
        gpu: {
          requestAdapter: async () => {
            throw new Error('no')
          },
        },
      },
      languageModel: {
        availability: async () => {
          throw new Error('no')
        },
      },
    })
    expect(failing).toEqual({ webGpu: false, deviceMemoryGb: null, promptApi: null })
    expect((await detectDeviceCapabilities({ navigatorLike: { gpu: { requestAdapter: async () => null } } })).webGpu).toBe(
      false
    )
  })
})
