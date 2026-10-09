/**
 * What this browser can use for AI: the gateway (from the AI settings), the local server (probed) and device facts.
 * Pure store factory: the app instance is in capabilitiesStore.ts.
 */
import { getLocalServerHostingClass } from '@common/ai/localServerAddress'
import type { AiHostingClass, AiPolicy } from '@common/ai/policy'
import { normalizeAiPolicy } from '@common/ai/policy'

import { defaultLocalServerSettings } from './localServerSettings'
import type { LocalServerProbeResult } from './localServerProbe'
import type {
  AiCapabilities,
  AiDeviceCapability,
  AiGatewayCapability,
  AiInstanceCapability,
  AiLocalServerCapability,
  AiLocalServerSettings,
} from './types'

// the fields of GET /api/ai/settings used here
export type AiSettingsSnapshot = {
  featuresEnabled?: boolean
  effectiveSource?: string | null
  effectiveProvider?: string | null
  effectiveModel?: string | null
  hostingClass?: AiHostingClass | null
  orgHostedBaseUrls?: string[]
  policyCeilings?: AiPolicy
  maxPromptChars?: number
  capabilityStats?: boolean
}

export type CapabilitiesStoreDeps = {
  loadSettings: (options: { force: boolean }) => Promise<AiSettingsSnapshot | null>
  loadLocalSettings: (userUuid: string | null) => AiLocalServerSettings
  probe: (params: { baseUrl: string; modelId: string | null }) => Promise<LocalServerProbeResult>
  detectDevice: () => Promise<AiDeviceCapability>
}

export type AiCapabilitiesStore = {
  get: () => AiCapabilities
  getSettings: () => AiSettingsSnapshot | null
  getLocalSettings: () => AiLocalServerSettings
  getLoadedFor: () => string | null | undefined
  load: (params: { userUuid: string | null }) => Promise<AiCapabilities>
  refresh: (params: { userUuid: string | null }) => Promise<AiCapabilities>
  detectDevice: () => Promise<AiDeviceCapability>
  reset: () => void
  subscribe: (listener: () => void) => () => void
  notify: () => void
}

type NavigatorLike = {
  gpu?: { requestAdapter?: () => Promise<unknown> }
  deviceMemory?: number
}
type PromptApiLike = { availability?: () => Promise<unknown> } | undefined

/**
 * Returns the gateway capability from the AI settings response.
 * @param {AiSettingsSnapshot|null} settings - AI settings.
 * @returns {AiGatewayCapability} Available when a provider is configured and its hosting class is known.
 */
export const buildGatewayCapability = (settings: AiSettingsSnapshot | null): AiGatewayCapability => {
  const hostingClass = settings?.hostingClass ?? null
  return {
    available: !!settings?.effectiveSource && !!hostingClass,
    hostingClass,
    provider: settings?.effectiveProvider ?? null,
    model: settings?.effectiveModel ?? null,
    maxPromptChars: settings?.maxPromptChars ?? null,
  }
}

/**
 * Returns the instance facts from the AI settings response.
 * @param {AiSettingsSnapshot|null} settings - AI settings.
 * @returns {AiInstanceCapability} Policy ceilings and org-hosted allowlist.
 */
export const buildInstanceCapability = (settings: AiSettingsSnapshot | null): AiInstanceCapability => ({
  // normalized: a partial or garbled object from the server fails closed
  policyCeilings: settings?.policyCeilings ? normalizeAiPolicy(settings.policyCeilings) : null,
  orgHostedBaseUrls: Array.isArray(settings?.orgHostedBaseUrls) ? settings.orgHostedBaseUrls : [],
})

/**
 * Returns the local server capability from the settings and the last probe.
 * @param {object} params - Parameters.
 * @param {AiLocalServerSettings} params.localSettings - Local server settings.
 * @param {LocalServerProbeResult|null} params.probe - Last probe (null: not probed).
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {AiLocalServerCapability} The capability.
 */
export const buildLocalServerCapability = ({
  localSettings,
  probe,
  allowlist,
}: {
  localSettings: AiLocalServerSettings
  probe: LocalServerProbeResult | null
  allowlist: string[]
}): AiLocalServerCapability => {
  const { enabled, baseUrl, modelId } = localSettings
  return {
    enabled,
    reachable: enabled && probe ? probe.reachable : null,
    models: enabled && probe ? probe.models : [],
    hostingClass: enabled ? getLocalServerHostingClass(baseUrl, allowlist) : null,
    contextTokens: enabled && probe ? probe.contextTokens : null,
    baseUrl: enabled ? baseUrl : null,
    modelId,
    error: enabled && probe ? probe.error : null,
  }
}

/**
 * Returns the capabilities before anything is loaded (nothing available).
 * @returns {AiCapabilities} The capabilities.
 */
export const emptyCapabilities = (): AiCapabilities => ({
  localServer: buildLocalServerCapability({ localSettings: defaultLocalServerSettings(), probe: null, allowlist: [] }),
  gateway: buildGatewayCapability(null),
  device: { webGpu: false, deviceMemoryGb: null, promptApi: null },
  instance: buildInstanceCapability(null),
})

const detectWebGpu = async (navigatorLike: NavigatorLike | undefined): Promise<boolean> => {
  try {
    const adapter = await navigatorLike?.gpu?.requestAdapter?.()
    return !!adapter
  } catch {
    return false
  }
}

const detectPromptApi = async (languageModel: PromptApiLike): Promise<string | null> => {
  if (typeof languageModel?.availability !== 'function') return null
  try {
    return String(await languageModel.availability())
  } catch {
    return null
  }
}

/**
 * Reads the device facts without downloading anything.
 * @param {object} params - Parameters.
 * @param {NavigatorLike} [params.navigatorLike] - The browser navigator.
 * @param {PromptApiLike} [params.languageModel] - The Prompt API global (LanguageModel), when present.
 * @returns {Promise<AiDeviceCapability>} WebGPU adapter availability, device memory and Prompt API availability.
 */
export const detectDeviceCapabilities = async ({
  navigatorLike,
  languageModel,
}: {
  navigatorLike?: NavigatorLike
  languageModel?: PromptApiLike
}): Promise<AiDeviceCapability> => ({
  webGpu: await detectWebGpu(navigatorLike),
  deviceMemoryGb: typeof navigatorLike?.deviceMemory === 'number' ? navigatorLike.deviceMemory : null,
  promptApi: await detectPromptApi(languageModel),
})

const emptySnapshot = emptyCapabilities()

/**
 * Returns the capabilities for the logged-in user: data that belongs to another user (or to nobody) is never
 * returned, a stable empty object is.
 * @param {AiCapabilitiesStore} store - The store.
 * @param {string|null} currentUserUuid - UUID of the logged-in user (null: nobody).
 * @returns {AiCapabilities} The capabilities (same object until something changes).
 */
export const getCapabilitiesSnapshotForUser = (
  store: AiCapabilitiesStore,
  currentUserUuid: string | null
): AiCapabilities => {
  const loadedFor = store.getLoadedFor()
  return loadedFor !== undefined && loadedFor !== currentUserUuid ? emptySnapshot : store.get()
}

/**
 * Returns whether the store holds the loaded capabilities of the current user (false before the first load, and for
 * another user's data), so a feature is not reported as having no engine from the empty snapshot.
 * @param {AiCapabilitiesStore} store - The store.
 * @param {string|null} currentUserUuid - UUID of the logged-in user.
 * @returns {boolean} True when loaded for this user.
 */
export const isCapabilitiesLoadedForUser = (store: AiCapabilitiesStore, currentUserUuid: string | null): boolean =>
  currentUserUuid !== null && store.getLoadedFor() === currentUserUuid

/**
 * Creates a capabilities store.
 * @param {CapabilitiesStoreDeps} deps - Settings, local settings, probe and device readers.
 * @returns {AiCapabilitiesStore} The store.
 */
export const createCapabilitiesStore = (deps: CapabilitiesStoreDeps): AiCapabilitiesStore => {
  let capabilities = emptyCapabilities()
  let settings: AiSettingsSnapshot | null = null
  let localSettings = defaultLocalServerSettings()
  let loadedFor: string | null | undefined = undefined
  let inflight: { promise: Promise<AiCapabilities>; userUuid: string | null; force: boolean } | null = null
  let sequence = 0
  const listeners = new Set<() => void>()

  const emit = () => {
    for (const listener of [...listeners]) listener()
  }

  // runs a dependency; a failure gives the fallback (the capabilities then say "not available")
  const safely = async <T>(action: () => T | Promise<T>, fallback: T): Promise<T> => {
    try {
      return await action()
    } catch {
      return fallback
    }
  }

  const reset = () => {
    sequence += 1
    inflight = null
    capabilities = emptyCapabilities()
    settings = null
    localSettings = defaultLocalServerSettings()
    loadedFor = undefined
    emit()
  }

  // the data and the run in flight belong to another user: drop them before they can be read
  const resetIfOtherUser = (userUuid: string | null) => {
    const dataUser = inflight ? inflight.userUuid : loadedFor
    if (dataUser !== undefined && dataUser !== userUuid) reset()
  }

  const compute = async ({ userUuid, force }: { userUuid: string | null; force: boolean }) => {
    const current = ++sequence
    const nextSettings = await safely(() => deps.loadSettings({ force }), null)
    const nextLocal = await safely(() => deps.loadLocalSettings(userUuid), defaultLocalServerSettings())
    const probe = nextLocal.enabled
      ? await safely(() => deps.probe({ baseUrl: nextLocal.baseUrl, modelId: nextLocal.modelId }), null)
      : null
    // a newer run or a reset started meanwhile: its result wins
    if (current !== sequence) return capabilities
    settings = nextSettings
    localSettings = nextLocal
    const instance = buildInstanceCapability(nextSettings)
    capabilities = {
      localServer: buildLocalServerCapability({
        localSettings: nextLocal,
        probe,
        allowlist: instance.orgHostedBaseUrls,
      }),
      gateway: buildGatewayCapability(nextSettings),
      device: capabilities.device,
      instance,
    }
    loadedFor = userUuid
    emit()
    return capabilities
  }

  const run = (params: { userUuid: string | null; force: boolean }): Promise<AiCapabilities> => {
    const entry = { promise: null as unknown as Promise<AiCapabilities>, ...params }
    entry.promise = compute(params).finally(() => {
      if (inflight === entry) inflight = null
    })
    inflight = entry
    return entry.promise
  }

  return {
    get: () => capabilities,
    getSettings: () => settings,
    getLocalSettings: () => localSettings,
    getLoadedFor: () => loadedFor,
    load: ({ userUuid }) => {
      resetIfOtherUser(userUuid)
      if (loadedFor === userUuid) return Promise.resolve(capabilities)
      if (inflight && inflight.userUuid === userUuid) return inflight.promise
      return run({ userUuid, force: false })
    },
    refresh: ({ userUuid }) => {
      resetIfOtherUser(userUuid)
      if (inflight && inflight.userUuid === userUuid && inflight.force) return inflight.promise
      return run({ userUuid, force: true })
    },
    reset,
    detectDevice: async () => {
      const device = await deps.detectDevice()
      capabilities = { ...capabilities, device }
      emit()
      return device
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    // a new snapshot object, so useSyncExternalStore re-renders (consent decisions, local settings)
    notify: () => {
      capabilities = { ...capabilities }
      emit()
    },
  }
}
