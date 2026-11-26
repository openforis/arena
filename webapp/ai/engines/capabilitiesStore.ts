/**
 * App instance of the AI capabilities store (current user, browser fetch, localStorage, shared settings cache).
 */
import { isLocalProviderId } from '@common/ai/providerIds'
import * as User from '@core/user/user'
import { getBrowserLocalStorage } from '@webapp/ai/storage/resilientStorage'
import { isAiSettingsFetchError } from '@webapp/components/ai/hooks/aiSettingsCache'
import { fetchAiSettingsOnce, invalidateAiSettingsCache } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { store as reduxStore } from '@webapp/store/store'
import { UserState } from '@webapp/store/user'

import {
  type AiCapabilitiesStore,
  type AiSettingsSnapshot,
  createCapabilitiesStore,
  getCapabilitiesSnapshotForUser,
} from './capabilities'
import { loadLocalProviders } from './localProviders'
import { type LocalServerProbeResult, probeLocalServer, testLocalServerChat } from './localServerProbe'
import type { AiCapabilities } from './types'

// bound call: an unbound window.fetch throws "Illegal invocation"
const browserFetch = (url: string, init?: RequestInit): Promise<Response> => fetch(url, init)

const capabilitiesStore = createCapabilitiesStore({
  loadSettings: async ({ force }) => {
    const settings = await (force ? invalidateAiSettingsCache() : fetchAiSettingsOnce())
    // a fetch that failed for a reason that may pass is no settings: the next load() asks again
    return isAiSettingsFetchError(settings) ? null : (settings as AiSettingsSnapshot)
  },
  loadLocalProviders: (userUuid) => loadLocalProviders({ storage: getBrowserLocalStorage(), userUuid }),
  probe: ({ baseUrl, modelId }) => probeLocalServer({ baseUrl, modelId, fetchImpl: browserFetch }),
})

/**
 * Returns the UUID of the logged-in user, or null.
 */
export const getCurrentUserUuid = (): string | null => User.getUuid(UserState.getUser(reduxStore.getState())) ?? null

/**
 * Returns the app capabilities store.
 */
export const getAiCapabilitiesStore = (): AiCapabilitiesStore => capabilitiesStore

/**
 * Loads the capabilities once per session (probes the local server when it is enabled).
 */
export const loadAiCapabilities = (): Promise<AiCapabilities> =>
  capabilitiesStore.load({ userUuid: getCurrentUserUuid() })

/**
 * Reloads the AI settings and probes the local server again (after a settings change, or Retry).
 * @param {object} [options] - Options.
 * @param {boolean} [options.probe] - False to keep the stored probes (only the settings are read again).
 */
export const refreshAiCapabilities = ({ probe = true }: { probe?: boolean } = {}): Promise<AiCapabilities> =>
  capabilitiesStore.refresh({ userUuid: getCurrentUserUuid(), probe })

/**
 * Probes a local server and asks it one question for the settings' Test button, with the same fetch as the engine (the capabilities do not change).
 * @param {object} params - Parameters.
 * @param {string} params.baseUrl - Server URL.
 * @param {string|null} params.modelId - Chosen model.
 */
export const testLocalServer = ({
  baseUrl,
  modelId,
}: {
  baseUrl: string
  modelId: string | null
}): Promise<LocalServerProbeResult> => testLocalServerChat({ baseUrl, modelId, fetchImpl: browserFetch })

/**
 * Tells the subscribers that something they derive from the capabilities changed (e.g. a consent decision).
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
 */
export const getAiCapabilitiesSnapshot = (): AiCapabilities =>
  getCapabilitiesSnapshotForUser(capabilitiesStore, getCurrentUserUuid())

/**
 * Drops the capabilities of the previous user (login, logout).
 */
export const resetAiCapabilities = (): void => capabilitiesStore.reset()

const REPROBE_MIN_INTERVAL_MS = 10000
let lastReprobeAt = 0

/**
 * Tells whether the selected (default) provider is a local server that was found unreachable.
 * @returns {boolean} True when it is.
 */
const isSelectedLocalServerUnreachable = (): boolean => {
  const { defaultProviderId, local } = getAiCapabilitiesSnapshot()
  return isLocalProviderId(defaultProviderId) && local[defaultProviderId]?.reachable === false
}

/**
 * Probes again when the window gets focus or becomes visible, while the selected local server is unreachable (the
 * user started it meanwhile), at most once every 10 s (shared by all callers).
 * @returns {Function} Removes the listeners.
 */
export const startAiLocalServerReprobe = (): (() => void) => {
  const onWake = () => {
    if (document.visibilityState === 'hidden' || !isSelectedLocalServerUnreachable()) return
    if (Date.now() - lastReprobeAt < REPROBE_MIN_INTERVAL_MS) return
    lastReprobeAt = Date.now()
    refreshAiCapabilities().catch(() => undefined)
  }
  window.addEventListener('focus', onWake)
  document.addEventListener('visibilitychange', onWake)
  return () => {
    window.removeEventListener('focus', onWake)
    document.removeEventListener('visibilitychange', onWake)
  }
}
