/**
 * App instance of the AI capabilities store (current user, browser fetch, localStorage, shared settings cache).
 */
import * as User from '@core/user/user'

import { fetchAiSettingsOnce, invalidateAiSettingsCache } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { store as reduxStore } from '@webapp/store/store'
import { UserState } from '@webapp/store/user'

import {
  type AiCapabilitiesStore,
  type AiSettingsSnapshot,
  createCapabilitiesStore,
  getCapabilitiesSnapshotForUser,
} from './capabilities'
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
})

/**
 * Returns the UUID of the logged-in user, or null.
 * @returns {string|null} The UUID.
 */
export const getCurrentUserUuid = (): string | null => User.getUuid(UserState.getUser(reduxStore.getState())) ?? null

/**
 * Returns the app capabilities store.
 * @returns {AiCapabilitiesStore} The store.
 */
export const getAiCapabilitiesStore = (): AiCapabilitiesStore => capabilitiesStore

/**
 * Loads the capabilities once per session (probes the local server when it is enabled).
 * @returns {Promise<AiCapabilities>} The capabilities.
 */
export const loadAiCapabilities = (): Promise<AiCapabilities> =>
  capabilitiesStore.load({ userUuid: getCurrentUserUuid() })

/**
 * Reloads the AI settings and probes the local server again (after a settings change, or Retry).
 * @returns {Promise<AiCapabilities>} The capabilities.
 */
export const refreshAiCapabilities = (): Promise<AiCapabilities> =>
  capabilitiesStore.refresh({ userUuid: getCurrentUserUuid() })

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
