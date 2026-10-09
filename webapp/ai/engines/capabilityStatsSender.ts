/**
 * Builds and sends the anonymous capability statistics, at most once per browser session, only when the user
 * opted in. Pure (storage and send are injected).
 */
import type { AiCapabilityStats } from '@common/ai/capabilityStats'

import type { AiCapabilities, AiLocalServerCapability, StorageLike } from './types'

export const CAPABILITY_STATS_SENT_KEY = 'arena.ai.capabilityStatsSent'

/**
 * Returns the memory bucket of `navigator.deviceMemory` (GB, capped at 8 by the browsers).
 * @param {number|null} gb - Device memory.
 * @returns {AiCapabilityStats['deviceMemoryBucket']} The bucket, or null when unknown.
 */
export const getDeviceMemoryBucket = (gb: number | null): AiCapabilityStats['deviceMemoryBucket'] => {
  if (typeof gb !== 'number' || !Number.isFinite(gb) || gb <= 0) return null
  if (gb <= 2) return '≤2'
  return gb < 8 ? '4' : '8+'
}

/**
 * Returns the browser family from the user agent (Edge and Chrome on iOS included).
 * @param {string} userAgent - User agent.
 * @returns {AiCapabilityStats['browser']} The family.
 */
export const getBrowserFamily = (userAgent: string): AiCapabilityStats['browser'] => {
  if (/Edg(A|iOS)?\//.test(userAgent)) return 'edge'
  if (/Firefox\/|FxiOS\//.test(userAgent)) return 'firefox'
  if (/Chrome\/|CriOS\/|Chromium\//.test(userAgent)) return 'chrome'
  if (/Safari\//.test(userAgent)) return 'safari'
  return 'other'
}

/**
 * Returns the Prompt API state for the statistics ("downloading" counts as downloadable).
 * @param {string|null} availability - `LanguageModel.availability()` result.
 * @returns {AiCapabilityStats['promptApi']} The state, or null when the API is missing.
 */
export const getPromptApiState = (availability: string | null): AiCapabilityStats['promptApi'] => {
  if (availability === 'available' || availability === 'unavailable') return availability
  if (availability === 'downloadable' || availability === 'downloading') return 'downloadable'
  return null
}

const getLocalServerStat = (localServer: AiLocalServerCapability): AiCapabilityStats['localServer'] => {
  if (!localServer.enabled || !localServer.hostingClass) return 'off'
  return localServer.reachable === false ? 'unreachable' : localServer.hostingClass
}

/**
 * Returns the statistics payload (no user, URL, model or survey content).
 * @param {object} params - Parameters.
 * @param {AiCapabilities} params.capabilities - Capabilities (device detected).
 * @param {string} params.userAgent - User agent.
 * @returns {AiCapabilityStats} The payload.
 */
export const buildCapabilityStatsPayload = ({
  capabilities,
  userAgent,
}: {
  capabilities: AiCapabilities
  userAgent: string
}): AiCapabilityStats => ({
  webGpu: capabilities.device.webGpu,
  deviceMemoryBucket: getDeviceMemoryBucket(capabilities.device.deviceMemoryGb),
  promptApi: getPromptApiState(capabilities.device.promptApi),
  localServer: getLocalServerStat(capabilities.localServer),
  browser: getBrowserFamily(userAgent),
})

/**
 * Creates the sender.
 * @param {object} deps - Dependencies.
 * @param {StorageLike|null} deps.storage - Session storage (null: once per page load).
 * @param {Function} deps.send - Posts the payload.
 * @returns {{maybeSend: Function}} The sender.
 */
export const createCapabilityStatsSender = ({
  storage,
  send,
}: {
  storage: StorageLike | null
  send: (stats: AiCapabilityStats) => Promise<unknown>
}) => {
  let sentInMemory = false

  const alreadySent = (): boolean => {
    try {
      return sentInMemory || storage?.getItem(CAPABILITY_STATS_SENT_KEY) === 'true'
    } catch {
      return sentInMemory
    }
  }

  const markSent = (): void => {
    sentInMemory = true
    try {
      storage?.setItem(CAPABILITY_STATS_SENT_KEY, 'true')
    } catch {
      // storage full or blocked: the in-memory flag still limits it to this page load
    }
  }

  return {
    /**
     * Sends the statistics when the user opted in and they were not sent in this session.
     * @param {object} params - Parameters.
     * @param {boolean} params.optedIn - The user's capabilityStats pref.
     * @param {Function} params.getPayload - Builds the payload (called only when sending).
     * @returns {Promise<boolean>} True when sent.
     */
    maybeSend: async ({
      optedIn,
      getPayload,
    }: {
      optedIn: boolean
      getPayload: () => Promise<AiCapabilityStats> | AiCapabilityStats
    }): Promise<boolean> => {
      if (!optedIn || alreadySent()) return false
      // marked first: concurrent loads send once; a failed request is not retried (statistics only)
      markSent()
      try {
        await send(await getPayload())
        return true
      } catch {
        return false
      }
    },
  }
}
