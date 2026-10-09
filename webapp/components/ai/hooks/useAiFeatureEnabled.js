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
 * category returns false. Entry points also hide when the server disables every
 * feature of the category (`AI_FEATURE_FLAGS`).
 */
import { useEffect, useReducer } from 'react'

import { isAiCategoryAvailable } from '@common/ai/features'
import * as API from '@webapp/service/api'
import { useSystemConfigAiFeaturesEnabled } from '@webapp/store/system'

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
      const data = error?.response?.data
      const code = data?.key ?? data?.error
      const status = error?.response?.status
      if (code === 'aiFeaturesDisabled' || status === 404 || status === 403) {
        cache = { featuresEnabled: false, featureToggles: {}, disabledFeatures: [] }
      } else {
        // Network or other error: leave cache as the safest fallback so
        // we hide AI buttons rather than flashing them in.
        cache = { featuresEnabled: false, featureToggles: {}, disabledFeatures: [], _fetchError: true }
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
 * Returns the AI settings of the user (fetched once per session, shared with the hooks).
 * @returns {Promise<object>} The settings response (a "force off" object when the fetch failed).
 */
export const fetchAiSettingsOnce = () => fetchOnce()

/**
 * Returns the cached AI settings without fetching.
 * @returns {object|null} The settings, or null while not loaded.
 */
export const getAiSettingsSnapshot = () => cache

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
 * Returns true when the master toggle is on AND the given category toggle
 * is on for the current user. Returns false while the initial fetch is in
 * flight so AI buttons don't flash in then disappear.
 * @param {string} category - One of "chat", "expressions", "translation", "dataDictionary", "userActivity", "dataQuery".
 * @returns {boolean} Whether this category's UI should render.
 */
export const useAiFeatureEnabled = (category) => {
  const aiFeaturesEnabledInSystemConfig = useSystemConfigAiFeaturesEnabled()
  // re-render when the shared settings cache changes
  const [, forceRender] = useReducer((count) => count + 1, 0)

  useEffect(() => {
    const onChange = () => forceRender()
    listeners.add(onChange)

    if (aiFeaturesEnabledInSystemConfig && !cache && !inflight) {
      fetchOnce()
    }
    return () => {
      listeners.delete(onChange)
    }
  }, [aiFeaturesEnabledInSystemConfig])

  if (!aiFeaturesEnabledInSystemConfig) return false
  if (!cache) return false
  return (
    !!cache.featuresEnabled &&
    !!cache.featureToggles?.[category] &&
    isAiCategoryAvailable(category, cache.disabledFeatures ?? [])
  )
}
