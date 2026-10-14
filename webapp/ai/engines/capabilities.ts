/**
 * What this browser can use for AI: one entry per provider (account providers from the AI settings, local providers
 * probed in this browser, Arena default), the instance limits, and (until the single-provider selection replaces
 * them) the old gateway and local server capabilities. Pure store factory: the app instance is in capabilitiesStore.ts.
 */
import { getLocalServerHostingClass } from '@common/ai/localServerAddress'
import type { AiHostingClass, AiPolicy } from '@common/ai/policy'
import { normalizeAiPolicy } from '@common/ai/policy'
import type { AiDefaultProviderOrigin } from '@common/ai/providerIds'

import type { LocalProvider } from './localProviders'
import { defaultLocalServerSettings } from './localServerSettings'
import type { LocalServerProbeResult } from './localServerProbe'
import {
  type AiAdminDefault,
  type AiPublicProvider,
  buildProviderEntries,
  getDefaultProviderId,
} from './providerEntries'
import type {
  AiCapabilities,
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
  defaultProviderId?: string
  defaultProviderOrigin?: AiDefaultProviderOrigin
  providers?: AiPublicProvider[]
  adminDefault?: AiAdminDefault | null
}

export type CapabilitiesStoreDeps = {
  loadSettings: (options: { force: boolean; userUuid: string | null }) => Promise<AiSettingsSnapshot | null>
  loadLocalSettings: (userUuid: string | null) => AiLocalServerSettings
  loadLocalProviders: (userUuid: string | null) => LocalProvider[]
  probe: (params: { baseUrl: string; modelId: string | null }) => Promise<LocalServerProbeResult>
}

export type AiCapabilitiesStore = {
  get: () => AiCapabilities
  getSettings: () => AiSettingsSnapshot | null
  getLocalSettings: () => AiLocalServerSettings
  getLoadedFor: () => string | null | undefined
  load: (params: { userUuid: string | null }) => Promise<AiCapabilities>
  refresh: (params: { userUuid: string | null }) => Promise<AiCapabilities>
  reset: () => void
  subscribe: (listener: () => void) => () => void
  notify: () => void
}

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
 * Returns the capability of one local provider from its last probe.
 * @param {object} params - Parameters.
 * @param {LocalProvider} params.provider - Local provider.
 * @param {LocalServerProbeResult|null} params.probe - Last probe (null: not probed, or the probe failed).
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {AiLocalServerCapability} The capability.
 */
export const buildLocalProviderCapability = ({
  provider,
  probe,
  allowlist,
}: {
  provider: LocalProvider
  probe: LocalServerProbeResult | null
  allowlist: string[]
}): AiLocalServerCapability => ({
  enabled: true,
  reachable: probe ? probe.reachable : null,
  models: probe ? probe.models : [],
  hostingClass: getLocalServerHostingClass(provider.baseUrl, allowlist),
  contextTokens: probe ? probe.contextTokens : null,
  baseUrl: provider.baseUrl,
  modelId: provider.modelId,
  error: probe ? probe.error : null,
})

type CapabilityInputs = {
  settings: AiSettingsSnapshot | null
  localSettings: AiLocalServerSettings
  localProbe: LocalServerProbeResult | null
  localProviders: LocalProvider[]
  // same order as localProviders
  probes: Array<LocalServerProbeResult | null>
}

/**
 * Builds the capabilities from the loaded settings, local providers and probes.
 * @param {CapabilityInputs} inputs - Loaded data.
 * @returns {AiCapabilities} The capabilities.
 */
const buildCapabilities = ({
  settings,
  localSettings,
  localProbe,
  localProviders,
  probes,
}: CapabilityInputs): AiCapabilities => {
  const instance = buildInstanceCapability(settings)
  const local: Record<string, AiLocalServerCapability> = {}
  for (const [index, provider] of localProviders.entries()) {
    local[provider.id] = buildLocalProviderCapability({
      provider,
      probe: probes[index] ?? null,
      allowlist: instance.orgHostedBaseUrls,
    })
  }
  return {
    localServer: buildLocalServerCapability({
      localSettings,
      probe: localProbe,
      allowlist: instance.orgHostedBaseUrls,
    }),
    gateway: buildGatewayCapability(settings),
    instance,
    providers: buildProviderEntries({
      accountProviders: Array.isArray(settings?.providers) ? settings.providers : [],
      localProviders,
      local,
      adminDefault: settings?.adminDefault ?? null,
    }),
    defaultProviderId: getDefaultProviderId(settings),
    local,
  }
}

/**
 * Returns the capabilities before anything is loaded (nothing available).
 * @returns {AiCapabilities} The capabilities.
 */
export const emptyCapabilities = (): AiCapabilities =>
  buildCapabilities({
    settings: null,
    localSettings: defaultLocalServerSettings(),
    localProbe: null,
    localProviders: [],
    probes: [],
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
 * @param {CapabilitiesStoreDeps} deps - Settings, local settings, local providers and probe readers.
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

  /** Calls every subscriber. */
  const emit = () => {
    for (const listener of [...listeners]) listener()
  }

  // runs a dependency; a failure gives the fallback (the capabilities then say "not available")
  /**
   * Runs a dependency, a failure gives the fallback.
   * @param {Function} action - Dependency call.
   * @param {*} fallback - Value on failure.
   * @returns {Promise<*>} The result or the fallback.
   */
  const safely = async <T>(action: () => T | Promise<T>, fallback: T): Promise<T> => {
    try {
      return await action()
    } catch {
      return fallback
    }
  }

  /** Drops everything loaded and tells the subscribers. */
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
  /**
   * Resets when the data or the run in flight belongs to another user.
   * @param {string|null} userUuid - Current user.
   */
  const resetIfOtherUser = (userUuid: string | null) => {
    const dataUser = inflight ? inflight.userUuid : loadedFor
    if (dataUser !== undefined && dataUser !== userUuid) reset()
  }

  // the newer run of the same user (running, or already stored), else (reset, other user) empty capabilities
  /**
   * Returns the result of the newer run of this user, else empty capabilities.
   * @param {string|null} userUuid - Current user.
   * @returns {Promise<AiCapabilities>} The capabilities.
   */
  const newerRun = (userUuid: string | null): Promise<AiCapabilities> =>
    inflight && inflight.userUuid === userUuid
      ? inflight.promise
      : Promise.resolve(loadedFor === userUuid ? capabilities : emptyCapabilities())

  /**
   * Probes a local server, a failure gives null (not tested).
   * @param {string} baseUrl - Server URL.
   * @param {string|null} modelId - Chosen model.
   * @returns {Promise<LocalServerProbeResult|null>} The probe result, or null.
   */
  const probeSafely = (baseUrl: string, modelId: string | null) =>
    safely<LocalServerProbeResult | null>(() => deps.probe({ baseUrl, modelId }), null)

  /**
   * Loads settings, local providers and probes, then stores the capabilities.
   * @param {object} params - Parameters.
   * @param {string|null} params.userUuid - Current user.
   * @param {boolean} params.force - Skip the settings cache.
   * @returns {Promise<AiCapabilities>} The capabilities.
   */
  const compute = async ({ userUuid, force }: { userUuid: string | null; force: boolean }) => {
    const current = ++sequence
    const nextSettings = await safely(() => deps.loadSettings({ force, userUuid }), null)
    const nextLocal = await safely(() => deps.loadLocalSettings(userUuid), defaultLocalServerSettings())
    const localProviders = await safely(() => deps.loadLocalProviders(userUuid), [] as LocalProvider[])
    // every server is probed at the same time: one slow server does not delay the others
    const [localProbe, ...probes] = await Promise.all([
      nextLocal.enabled ? probeSafely(nextLocal.baseUrl, nextLocal.modelId) : Promise.resolve(null),
      ...localProviders.map((provider) => probeSafely(provider.baseUrl, provider.modelId)),
    ])
    // a newer run started meanwhile: wait for its result; after a reset or a user change nothing is returned
    if (current !== sequence) return newerRun(userUuid)
    settings = nextSettings
    localSettings = nextLocal
    capabilities = buildCapabilities({
      settings: nextSettings,
      localSettings: nextLocal,
      localProbe,
      localProviders,
      probes,
    })
    loadedFor = userUuid
    emit()
    return capabilities
  }

  /**
   * Starts a run and keeps it as the one in flight.
   * @param {object} params - Parameters.
   * @param {string|null} params.userUuid - Current user.
   * @param {boolean} params.force - Skip the settings cache.
   * @returns {Promise<AiCapabilities>} The capabilities.
   */
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
