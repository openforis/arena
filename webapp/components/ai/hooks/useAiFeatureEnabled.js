/**
 * Hook that tells AI entry-point components whether they should render.
 *
 * Settings are fetched once per session at module level (with in-flight
 * dedupe) and shared across every consumer. After the AI Settings panel
 * saves, it should call {@link invalidateAiSettingsCache} so the rest of
 * the UI re-evaluates without a page reload.
 *
 * When the server reports AI features disabled at the admin level (404 or
 * `aiFeaturesDisabled`), the cache is set to a "force off" state so every
 * category returns false.
 */
import { useEffect, useState } from 'react'

import * as API from '@webapp/service/api'

let cache = null
let inflight = null
const listeners = new Set()

const notify = () => listeners.forEach((cb) => cb())

const fetchOnce = () => {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight
  inflight = (async () => {
    try {
      cache = await API.aiSettings.fetchSettings()
    } catch (error) {
      const code = error?.response?.data?.error
      if (code === 'aiFeaturesDisabled' || error?.response?.status === 404) {
        cache = { featuresEnabled: false, featureToggles: {} }
      } else {
        // Network or other error: leave cache as the safest fallback so
        // we hide AI buttons rather than flashing them in.
        cache = { featuresEnabled: false, featureToggles: {}, _fetchError: true }
      }
    } finally {
      inflight = null
      notify()
    }
    return cache
  })()
  return inflight
}

/**
 * Drops the cached AI settings and triggers a re-fetch. Call this from the
 * AI Settings panel after `Save` / `Clear` so other components pick up the
 * new toggles immediately.
 * @returns {void}
 */
export const invalidateAiSettingsCache = () => {
  cache = null
  inflight = null
  fetchOnce()
}

/**
 * Subscribe to cache-invalidation / re-fetch events. Useful for components
 * that don't read the hook's value but maintain their own AI-status state
 * (e.g. the chatbot FAB, which probes a separate status endpoint).
 * @param {Function} cb - Called whenever the cache changes (after a fetch
 *   completes, including after `invalidateAiSettingsCache`).
 * @returns {Function} Unsubscribe function.
 */
export const onAiSettingsInvalidated = (cb) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

/**
 * Returns true when the master toggle is on AND the given category toggle
 * is on for the current user. Returns false while the initial fetch is in
 * flight so AI buttons don't flash in then disappear.
 * @param {string} category - One of "chat", "expressions", "analysis".
 * @returns {boolean} Whether this category's UI should render.
 */
export const useAiFeatureEnabled = (category) => {
  const [_counter, setCounter] = useState(0)
  useEffect(() => {
    const onChange = () => setCounter((n) => n + 1)
    listeners.add(onChange)
    if (!cache && !inflight) fetchOnce()
    return () => {
      listeners.delete(onChange)
    }
  }, [])
  if (!cache) return false
  return !!cache.featuresEnabled && !!cache.featureToggles?.[category]
}
