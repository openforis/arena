/**
 * The session-wide cache of the user's AI settings (GET /api/ai/settings): one fetch shared by every consumer, with
 * in-flight dedupe. Pure factory (the transport is injected); the app instance is in useAiFeatureEnabled.js.
 */

// what a consumer gets while the AI is off for it: every category reads as disabled
const FORCE_OFF = { featuresEnabled: false, featureToggles: {}, disabledFeatures: [] }

export type AiSettingsResponse = Record<string, unknown> & {
  // set on the stand-in returned when the fetch failed for a reason that may pass (network, server error)
  _fetchError?: boolean
}

export type AiSettingsCacheDeps = {
  fetchSettings: () => Promise<AiSettingsResponse>
}

export type AiSettingsCache = {
  fetchOnce: () => Promise<AiSettingsResponse>
  getSnapshot: () => AiSettingsResponse | null
  invalidate: () => void
  reset: () => void
  subscribe: (listener: () => void) => () => void
}

/**
 * Returns true for the stand-in of a fetch that failed for a reason that may pass.
 * @param {AiSettingsResponse|null|undefined} settings - A result of the cache.
 * @returns {boolean} True when the settings could not be read (they are not the user's real settings).
 */
export const isAiSettingsFetchError = (settings: AiSettingsResponse | null | undefined): boolean =>
  settings?._fetchError === true

/**
 * Returns true when the server answered that AI is off for this user or instance (a lasting answer).
 * @param {any} error - The request error.
 * @returns {boolean} True for aiFeaturesDisabled, 403 and 404.
 */
const isDisabledAnswer = (error: any): boolean => {
  const data = error?.response?.data
  const code = data?.key ?? data?.error
  const status = error?.response?.status
  return code === 'aiFeaturesDisabled' || status === 404 || status === 403
}

/**
 * Creates the cache.
 * @param {AiSettingsCacheDeps} deps - The settings request.
 * @returns {AiSettingsCache} The cache. A fetch that failed for a reason that may pass (network, server error)
 * resolves with a "force off" stand-in marked `_fetchError` but is not kept: the next fetchOnce asks again.
 */
export const createAiSettingsCache = ({ fetchSettings }: AiSettingsCacheDeps): AiSettingsCache => {
  let cache: AiSettingsResponse | null = null
  let inflight: Promise<AiSettingsResponse> | null = null
  // bumped by every reset/invalidate: a fetch that started before cannot write its result
  let generation = 0
  const listeners = new Set<() => void>()

  /**
   * Tells every subscriber that the cache changed.
   * @returns {void} Nothing.
   */
  const notify = () => listeners.forEach((listener) => listener())

  /**
   * Fetches the settings; a failure gives a stand-in that hides AI (rather than flashing buttons in).
   * @returns {Promise<{result: AiSettingsResponse, keep: boolean}>} The result and whether it may be cached.
   */
  const read = async (): Promise<{ result: AiSettingsResponse; keep: boolean }> => {
    try {
      return { result: await fetchSettings(), keep: true }
    } catch (error) {
      // the server says AI is off: lasting. Any other error may pass: not kept
      if (isDisabledAnswer(error)) return { result: { ...FORCE_OFF }, keep: true }
      return { result: { ...FORCE_OFF, _fetchError: true }, keep: false }
    }
  }

  /**
   * Returns the cached settings, the fetch in flight, or starts a fetch.
   * @returns {Promise<AiSettingsResponse>} The settings.
   */
  const fetchOnce = (): Promise<AiSettingsResponse> => {
    if (cache) return Promise.resolve(cache)
    if (inflight) return inflight
    const startedAt = generation
    const current: Promise<AiSettingsResponse> = (async () => {
      const { result, keep } = await read()
      // reset or invalidated meanwhile: this result is not the cache's to keep (that run owns inflight now)
      if (startedAt !== generation) return result
      inflight = null
      if (!keep) return result
      cache = result
      notify()
      return result
    })()
    inflight = current
    return current
  }

  return {
    fetchOnce,
    getSnapshot: () => cache,
    invalidate: () => {
      generation += 1
      cache = null
      inflight = null
      fetchOnce().catch(() => undefined)
    },
    reset: () => {
      generation += 1
      cache = null
      inflight = null
      notify()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
