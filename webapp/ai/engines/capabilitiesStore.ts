/**
 * App instance of the AI capabilities store (current user, browser fetch, localStorage, shared settings cache).
 */
import * as User from '@core/user/user'

import { fetchAiSettingsOnce, invalidateAiSettingsCache } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { sendCapabilityStats } from '@webapp/service/api/ai/settings'
import { store as reduxStore } from '@webapp/store/store'
import { UserState } from '@webapp/store/user'

import {
  type AiCapabilitiesStore,
  type AiSettingsSnapshot,
  createCapabilitiesStore,
  detectDeviceCapabilities,
  getCapabilitiesSnapshotForUser,
} from './capabilities'
import { buildCapabilityStatsPayload, createCapabilityStatsSender } from './capabilityStatsSender'
import { getBrowserStorage, loadLocalServerSettings } from './localServerSettings'
import { type LocalServerProbeResult, probeLocalServer } from './localServerProbe'
import type { AiCapabilities } from './types'

// bound call: an unbound window.fetch throws "Illegal invocation"
const browserFetch = (url: string, init?: RequestInit): Promise<Response> => fetch(url, init)

const capabilitiesStore = createCapabilitiesStore({
  loadSettings: async ({ force }) => {
    if (force) invalidateAiSettingsCache()
    return (await fetchAiSettingsOnce()) as AiSettingsSnapshot
  },
  loadLocalSettings: (userUuid) => loadLocalServerSettings({ storage: getBrowserStorage(), userUuid }),
  probe: ({ baseUrl, modelId }) => probeLocalServer({ baseUrl, modelId, fetchImpl: browserFetch }),
  detectDevice: () =>
    detectDeviceCapabilities({
      navigatorLike: globalThis.navigator as never,
      languageModel: (globalThis as { LanguageModel?: never }).LanguageModel,
    }),
})

const capabilityStatsSender = createCapabilityStatsSender({
  storage: getBrowserStorage('session'),
  send: sendCapabilityStats,
})

/**
 * Returns the UUID of the logged-in user, or null.
 * @returns {string|null} The UUID.
 */
export const getCurrentUserUuid = (): string | null => User.getUuid(UserState.getUser(reduxStore.getState())) ?? null

// the store still holds the data of the user who asked for the load, and that user is still logged in
const isStoreCurrentFor = (userUuid: string | null): boolean =>
  userUuid !== null && getCurrentUserUuid() === userUuid && capabilitiesStore.getLoadedFor() === userUuid

/**
 * Posts the capability statistics once per browser session when the user opted in (device detection only then).
 * @param {string|null} userUuid - User who asked for the load.
 * @returns {void}
 */
const sendCapabilityStatsIfOptedIn = (userUuid: string | null): void => {
  if (!isStoreCurrentFor(userUuid)) return
  capabilityStatsSender
    .maybeSend({
      optedIn: capabilitiesStore.getSettings()?.capabilityStats === true,
      getPayload: async () => {
        await capabilitiesStore.detectDevice()
        // logged out or switched user while detecting: nothing is sent
        if (!isStoreCurrentFor(userUuid)) throw new Error('user changed')
        return buildCapabilityStatsPayload({
          capabilities: capabilitiesStore.get(),
          userAgent: globalThis.navigator?.userAgent ?? '',
        })
      },
    })
    .catch(() => false)
}

/**
 * Returns the capabilities and, without waiting, posts the statistics when due.
 * @param {string|null} userUuid - User who asked for the load.
 * @param {Promise<AiCapabilities>} loading - Load or refresh of the store.
 * @returns {Promise<AiCapabilities>} The capabilities.
 */
const withCapabilityStats = async (
  userUuid: string | null,
  loading: Promise<AiCapabilities>
): Promise<AiCapabilities> => {
  const capabilities = await loading
  sendCapabilityStatsIfOptedIn(userUuid)
  return capabilities
}

/**
 * Returns the app capabilities store.
 * @returns {AiCapabilitiesStore} The store.
 */
export const getAiCapabilitiesStore = (): AiCapabilitiesStore => capabilitiesStore

/**
 * Loads the capabilities once per session (probes the local server when it is enabled).
 * @returns {Promise<AiCapabilities>} The capabilities.
 */
export const loadAiCapabilities = (): Promise<AiCapabilities> => {
  const userUuid = getCurrentUserUuid()
  return withCapabilityStats(userUuid, capabilitiesStore.load({ userUuid }))
}

/**
 * Reloads the AI settings and probes the local server again (after a settings change, or Retry).
 * @returns {Promise<AiCapabilities>} The capabilities.
 */
export const refreshAiCapabilities = (): Promise<AiCapabilities> => {
  const userUuid = getCurrentUserUuid()
  return withCapabilityStats(userUuid, capabilitiesStore.refresh({ userUuid }))
}

/**
 * Probes a local server for the settings' Test button, with the same fetch as the engine (the capabilities do not change).
 * @param {object} params - Parameters.
 * @param {string} params.baseUrl - Server URL.
 * @param {string|null} params.modelId - Chosen model.
 * @returns {Promise<LocalServerProbeResult>} The probe result.
 */
export const testLocalServer = ({
  baseUrl,
  modelId,
}: {
  baseUrl: string
  modelId: string | null
}): Promise<LocalServerProbeResult> => probeLocalServer({ baseUrl, modelId, fetchImpl: browserFetch })

/**
 * Tells the subscribers that something they derive from the capabilities changed (e.g. a consent decision).
 * @returns {void}
 */
export const notifyAiCapabilities = (): void => capabilitiesStore.notify()

/**
 * Subscribes to capability changes.
 * @param {Function} listener - Called after every change.
 * @returns {Function} Unsubscribe.
 */
export const subscribeAiCapabilities = (listener: () => void): (() => void) => capabilitiesStore.subscribe(listener)

/**
 * Returns the current capabilities (same object until something changes), never another user's.
 * @returns {AiCapabilities} The capabilities.
 */
export const getAiCapabilitiesSnapshot = (): AiCapabilities =>
  getCapabilitiesSnapshotForUser(capabilitiesStore, getCurrentUserUuid())

/**
 * Drops the capabilities of the previous user (login, logout).
 * @returns {void}
 */
export const resetAiCapabilities = (): void => capabilitiesStore.reset()
