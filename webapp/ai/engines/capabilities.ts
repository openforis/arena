/**
 * What this browser can use for AI: one entry per provider (account providers from the AI settings, local providers
 * probed in this browser, Arena default) and the instance limits. Pure store factory: the app instance is in
 * capabilitiesStore.ts.
 */
import { resolveAiAccessLevel } from '@common/ai/accessLevel'
import { getLocalServerHostingClass } from '@common/ai/localServerAddress'
import type { AiPolicy } from '@common/ai/policy'
import { normalizeAiPolicy } from '@common/ai/policy'
import type { AiDefaultProviderOrigin } from '@common/ai/providerIds'

import type { AiFeatureSwitches } from './featureSwitches'
import type { LocalProvider } from './localProviders'
import type { LocalServerProbeResult } from './localServerProbe'
import {
  type AiAdminDefault,
  type AiPublicProvider,
  buildProviderEntries,
  getDefaultProviderId,
} from './providerEntries'
import type { AiCapabilities, AiInstanceCapability, AiLocalServerCapability } from './types'

// the fields of GET /api/ai/settings used here (the access level and switches: AiFeatureSwitches)
export type AiSettingsSnapshot = AiFeatureSwitches & {
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
  loadLocalProviders: (userUuid: string | null) => LocalProvider[]
  probe: (params: { baseUrl: string; modelId: string | null }) => Promise<LocalServerProbeResult>
}

export type AiCapabilitiesStore = {
  get: () => AiCapabilities
  getSettings: () => AiSettingsSnapshot | null
  getLoadedFor: () => string | null | undefined
  load: (params: { userUuid: string | null }) => Promise<AiCapabilities>
  refresh: (params: { userUuid: string | null }) => Promise<AiCapabilities>
  reset: () => void
  subscribe: (listener: () => void) => () => void
  notify: () => void
}

/**
 * Returns the gateway prompt cap sent with the settings.
 * @param {unknown} value - Raw value.
 * @returns {number|null} A positive finite number, else null (the gateway engines then use the default cap).
 */
const toMaxPromptChars = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null

/**
 * Returns the instance facts from the AI settings response.
 * @param {AiSettingsSnapshot|null} settings - AI settings.
 * @returns {AiInstanceCapability} Policy ceilings, org-hosted allowlist and gateway prompt cap.
 */
export const buildInstanceCapability = (settings: AiSettingsSnapshot | null): AiInstanceCapability => ({
  // normalized: a partial or garbled object from the server fails closed
  policyCeilings: settings?.policyCeilings ? normalizeAiPolicy(settings.policyCeilings) : null,
  orgHostedBaseUrls: Array.isArray(settings?.orgHostedBaseUrls) ? settings.orgHostedBaseUrls : [],
  maxPromptChars: toMaxPromptChars(settings?.maxPromptChars),
})

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
  reachable: probe ? probe.reachable : null,
  models: probe ? probe.models : [],
  hostingClass: provider.addressInvalid ? null : getLocalServerHostingClass(provider.baseUrl, allowlist),
  contextTokens: probe ? probe.contextTokens : null,
  baseUrl: provider.baseUrl,
  modelId: provider.modelId,
  error: probe ? probe.error : null,
})

type CapabilityInputs = {
  settings: AiSettingsSnapshot | null
  localProviders: LocalProvider[]
  // same order as localProviders
  probes: Array<LocalServerProbeResult | null>
}

/**
 * Builds the capabilities from the loaded settings, local providers and probes.
 * @param {CapabilityInputs} inputs - Loaded data.
 * @returns {AiCapabilities} The capabilities.
 */
const buildCapabilities = ({ settings, localProviders, probes }: CapabilityInputs): AiCapabilities => {
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
  buildCapabilities({ settings: null, localProviders: [], probes: [] })

const emptySnapshot = emptyCapabilities()

/**
 * Returns true when the user's AI access is off (level 0): nothing of AI runs, so nothing is probed. A probe of a
 * local server can raise the browser's local network permission prompt for a user who does not use AI.
 * @param {AiSettingsSnapshot|null} settings - AI settings (null: not loaded, which is not known to be on).
 * @returns {boolean} True when AI is off or unknown.
 */
const isAiOff = (settings: AiSettingsSnapshot | null): boolean =>
  !settings ||
  resolveAiAccessLevel({
    accessLevel: settings.accessLevel,
    featuresEnabled: !!settings.featuresEnabled,
    featureToggles: settings.featureToggles,
  }) === 0

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
 * @param {CapabilitiesStoreDeps} deps - Settings, local providers and probe readers.
 * @returns {AiCapabilitiesStore} The store.
 */
export const createCapabilitiesStore = (deps: CapabilitiesStoreDeps): AiCapabilitiesStore => {
  let capabilities = emptyCapabilities()
  let settings: AiSettingsSnapshot | null = null
  let loadedFor: string | null | undefined = undefined
  // false after a load whose settings could not be read: the next load() tries again instead of keeping the empty
  // capabilities for the whole session
  let complete = false
  let inflight: { promise: Promise<AiCapabilities>; userUuid: string | null; force: boolean } | null = null
  let sequence = 0
  const listeners = new Set<() => void>()

  /**
   * Tells every subscriber that the capabilities changed.
   * @returns {void} Nothing.
   */
  const emit = () => {
    for (const listener of [...listeners]) listener()
  }

  /**
   * Runs a dependency; a failure gives the fallback (the capabilities then say "not available").
   * @param {Function} action - The dependency call.
   * @param {T} fallback - The value to return when it throws.
   * @returns {Promise<T>} The result, or the fallback.
   */
  const safely = async <T>(action: () => T | Promise<T>, fallback: T): Promise<T> => {
    try {
      return await action()
    } catch {
      return fallback
    }
  }

  /**
   * Drops the data and the run in flight, so nothing from before can be read or stored.
   * @returns {void} Nothing.
   */
  const reset = () => {
    sequence += 1
    inflight = null
    capabilities = emptyCapabilities()
    settings = null
    loadedFor = undefined
    complete = false
    emit()
  }

  /**
   * Drops the data and the run in flight when they belong to another user, before they can be read.
   * @param {string|null} userUuid - UUID of the current user.
   * @returns {void} Nothing.
   */
  const resetIfOtherUser = (userUuid: string | null) => {
    const dataUser = inflight ? inflight.userUuid : loadedFor
    if (dataUser !== undefined && dataUser !== userUuid) reset()
  }

  /**
   * Returns the result of the newer run of the same user (running, or already stored); after a reset or a user
   * change, empty capabilities.
   * @param {string|null} userUuid - UUID of the user whose run is waited for.
   * @returns {Promise<AiCapabilities>} The capabilities.
   */
  const newerRun = (userUuid: string | null): Promise<AiCapabilities> =>
    inflight && inflight.userUuid === userUuid
      ? inflight.promise
      : Promise.resolve(loadedFor === userUuid ? capabilities : emptyCapabilities())

  /**
   * Probes a local server; a failure gives null (not available).
   * @param {string} baseUrl - Server base URL.
   * @param {string|null} modelId - Chosen model.
   * @returns {Promise<LocalServerProbeResult|null>} The probe result, or null.
   */
  const probeSafely = (baseUrl: string, modelId: string | null) =>
    safely<LocalServerProbeResult | null>(() => deps.probe({ baseUrl, modelId }), null)

  /**
   * Loads the settings and the local providers, probes every local server and stores the capabilities.
   * @param {object} params - Parameters.
   * @param {string|null} params.userUuid - UUID of the user.
   * @param {boolean} params.force - Read the settings again instead of using the cache.
   * @returns {Promise<AiCapabilities>} The capabilities (those of a newer run when one started meanwhile).
   */
  const compute = async ({ userUuid, force }: { userUuid: string | null; force: boolean }) => {
    const current = ++sequence
    const nextSettings = await safely(() => deps.loadSettings({ force, userUuid }), null)
    // loadLocalProviders catches its own storage errors; this fallback is reached only when localStorage is unreadable,
    // which counts as "not on this browser"
    const localProviders = await safely(() => deps.loadLocalProviders(userUuid), [] as LocalProvider[])
    // every server is probed at the same time: one slow server does not delay the others; with AI off (or settings
    // that could not be read) none is probed: the next load with settings does
    const probes = isAiOff(nextSettings)
      ? localProviders.map(() => null)
      : await Promise.all(
          localProviders.map((provider) =>
            // an invalid address is never called
            provider.addressInvalid ? null : probeSafely(provider.baseUrl, provider.modelId)
          )
        )
    // a newer run started meanwhile: wait for its result; after a reset or a user change nothing is returned
    if (current !== sequence) return newerRun(userUuid)
    settings = nextSettings
    capabilities = buildCapabilities({ settings: nextSettings, localProviders, probes })
    loadedFor = userUuid
    complete = nextSettings !== null
    emit()
    return capabilities
  }

  /**
   * Starts a load and registers it as the run in flight until it ends.
   * @param {object} params - Parameters.
   * @param {string|null} params.userUuid - UUID of the user.
   * @param {boolean} params.force - Read the settings again instead of using the cache.
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
    getLoadedFor: () => loadedFor,
    load: ({ userUuid }) => {
      resetIfOtherUser(userUuid)
      if (loadedFor === userUuid && complete) return Promise.resolve(capabilities)
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
    // a new snapshot object, so useSyncExternalStore re-renders (consent decisions)
    notify: () => {
      capabilities = { ...capabilities }
      emit()
    },
  }
}
