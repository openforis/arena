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

import { createAiSettingsCache } from './aiSettingsCache'

const settingsCache = createAiSettingsCache({ fetchSettings: () => API.aiSettings.fetchSettings() })

/**
 * Returns the AI settings of the user (fetched once per session, shared with the hooks).
 * @returns {Promise<object>} The settings response (a "force off" object when the fetch failed; when it failed for a
 * reason that may pass it is marked `_fetchError` and not kept, so the next call asks again).
 */
export const fetchAiSettingsOnce = () => settingsCache.fetchOnce()

/**
 * Returns the cached AI settings without fetching.
 * @returns {object|null} The settings, or null while not loaded.
 */
export const getAiSettingsSnapshot = () => settingsCache.getSnapshot()

/**
 * Drops the cached AI settings and triggers a re-fetch. Call this from the
 * AI Settings panel after `Save` / `Clear` so other components pick up the
 * new toggles immediately.
 * @returns {void}
 */
export const invalidateAiSettingsCache = () => settingsCache.invalidate()

/**
 * Drops the cached AI settings and the fetch in flight without fetching again (login, logout): the next
 * consumer fetches the settings of the then logged-in user.
 * @returns {void}
 */
export const resetAiSettingsCache = () => settingsCache.reset()

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
    const unsubscribe = settingsCache.subscribe(() => forceRender())
    // after a fetch that failed for a reason that may pass, the next consumer that mounts asks again
    if (aiFeaturesEnabledInSystemConfig && userUuid) settingsCache.fetchOnce()
    return unsubscribe
  }, [aiFeaturesEnabledInSystemConfig, userUuid])

  const settings = settingsCache.getSnapshot()
  if (!aiFeaturesEnabledInSystemConfig) return false
  if (!settings) return false
  return isAiCategoryEnabledInSettings(settings, category)
}
