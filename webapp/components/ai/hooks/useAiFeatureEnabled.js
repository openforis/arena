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

import * as User from '@core/user/user'
import { isAiCategoryEnabledInSettings } from '@webapp/ai/engines/featureSwitches'
import * as API from '@webapp/service/api'
import { useSystemConfigAiFeaturesEnabled } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'

let cache = null
let inflight = null
// bumped by every reset/invalidate: a fetch that started before cannot write its result
let generation = 0
const listeners = new Set()

const notify = () => listeners.forEach((cb) => cb())

const fetchOnce = () => {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight
  const startedAt = generation
  const isCurrent = () => startedAt === generation
  inflight = (async () => {
    let result = null
    try {
      result = await API.aiSettings.fetchSettings()
    } catch (error) {
      const data = error?.response?.data
      const code = data?.key ?? data?.error
      const status = error?.response?.status
      if (code === 'aiFeaturesDisabled' || status === 404 || status === 403) {
        result = { featuresEnabled: false, featureToggles: {}, disabledFeatures: [] }
      } else {
        // Network or other error: leave cache as the safest fallback so
        // we hide AI buttons rather than flashing them in.
        result = { featuresEnabled: false, featureToggles: {}, disabledFeatures: [], _fetchError: true }
      }
    }
    if (!isCurrent()) return result
    cache = result
    inflight = null
    notify()
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
  generation += 1
  cache = null
  inflight = null
  fetchOnce()
}

/**
 * Drops the cached AI settings and the fetch in flight without fetching again (login, logout): the next
 * consumer fetches the settings of the then logged-in user.
 * @returns {void}
 */
export const resetAiSettingsCache = () => {
  generation += 1
  cache = null
  inflight = null
  notify()
}

/**
 * Returns true when the master toggle is on AND the given category toggle
 * is on for the current user. Returns false while the initial fetch is in
 * flight so AI buttons don't flash in then disappear.
 * @param {string} category - An AiFeatureCategory (common/ai/features.ts).
 * @returns {boolean} Whether this category's UI should render.
 */
export const useAiFeatureEnabled = (category) => {
  const aiFeaturesEnabledInSystemConfig = useSystemConfigAiFeaturesEnabled()
  // a login or logout drops the cache: the effect fetches again for the user who is logged in then
  const user = useUser()
  const userUuid = user ? (User.getUuid(user) ?? null) : null
  // re-render when the shared settings cache changes
  const [, forceRender] = useReducer((count) => count + 1, 0)

  useEffect(() => {
    const onChange = () => forceRender()
    listeners.add(onChange)

    if (aiFeaturesEnabledInSystemConfig && userUuid && !cache && !inflight) {
      fetchOnce()
    }
    return () => {
      listeners.delete(onChange)
    }
  }, [aiFeaturesEnabledInSystemConfig, userUuid])

  if (!aiFeaturesEnabledInSystemConfig) return false
  if (!cache) return false
  return isAiCategoryEnabledInSettings(cache, category)
}
