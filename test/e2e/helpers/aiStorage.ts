import type { Page } from '@playwright/test'

import { getLocalProvidersKey, type LocalProvider } from '@webapp/ai/engines/localProviders'
import type { SuggestionUserState } from '@webapp/ai/suggestions/state/types'
import { INTRO_MODULES } from '@webapp/ai/suggestions/prompts/moduleIntro'
import { getSuggestionsKey } from '@webapp/ai/suggestions/suggestionStore'

// The browser storage the AI specs seed and read. The keys and the shape of the state come from the app's own
// modules, so a change there breaks the typecheck of the specs instead of seeding a state the app ignores.

/**
 * Returns a suggestion state with the module introductions already seen, so only the cards a spec triggers show.
 * @returns {SuggestionUserState} The state.
 */
export const buildSeenIntrosSuggestionState = (): SuggestionUserState => ({
  pending: {},
  dismissed: {},
  inProgress: {},
  seenModules: [...INTRO_MODULES],
})

/**
 * Writes the suggestion state before any page script runs (on every navigation of the page), unless the browser
 * already stores one.
 * @param {Page} page - The page.
 * @param {string} userUuid - User uuid.
 * @param {SuggestionUserState} state - State to seed.
 * @returns {Promise<void>} Resolves when the init script is registered.
 */
export const seedSuggestionState = async (page: Page, userUuid: string, state: SuggestionUserState): Promise<void> => {
  await page.addInitScript(
    ({ key, value }) => {
      if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, value)
    },
    { key: getSuggestionsKey(userUuid), value: JSON.stringify(state) }
  )
}

// longer than the debounce of the suggestions host (1 s after the last survey change, events run at once)
const SUGGESTION_DETECTORS_SETTLE_MS = 2_500

/**
 * Gives the suggestion detectors their chance to run. A check that something does NOT show is worth nothing right
 * after the page is ready, because the detectors react asynchronously: wait past their debounce first, and use this
 * only next to a check that the same setup does show the card elsewhere.
 * @param {Page} page - The page.
 * @returns {Promise<void>} Resolves when the detectors have had their chance.
 */
export const waitForSuggestionDetectors = async (page: Page): Promise<void> => {
  // nothing observable marks a detector that ran and found nothing to suggest
  // eslint-disable-next-line playwright/no-wait-for-timeout
  await page.waitForTimeout(SUGGESTION_DETECTORS_SETTLE_MS)
}

/**
 * Reads the stored suggestion state of a user in the page.
 * @param {Page} page - The page.
 * @param {string} userUuid - User uuid.
 * @returns {Promise<SuggestionUserState|null>} The stored state; null while nothing was written.
 */
export const readSuggestionState = async (page: Page, userUuid: string): Promise<SuggestionUserState | null> =>
  page.evaluate((key): SuggestionUserState | null => {
    try {
      return JSON.parse(window.localStorage.getItem(key) ?? 'null')
    } catch {
      return null
    }
  }, getSuggestionsKey(userUuid))

/**
 * Writes the local providers of a user in the page's storage (the app reads them when it loads).
 * @param {Page} page - The page (on an app URL).
 * @param {string} userUuid - User uuid.
 * @param {LocalProvider[]} providers - The providers.
 * @returns {Promise<void>} Resolves when written.
 */
export const writeLocalProviders = async (page: Page, userUuid: string, providers: LocalProvider[]): Promise<void> => {
  await page.evaluate(
    ([key, value]) => window.localStorage.setItem(key, value),
    [getLocalProvidersKey(userUuid), JSON.stringify(providers)]
  )
}

/**
 * Writes the local providers before any page script runs (on every navigation of the page).
 * @param {Page} page - The page.
 * @param {string} userUuid - User uuid.
 * @param {LocalProvider[]} providers - The providers.
 * @returns {Promise<void>} Resolves when the init script is registered.
 */
export const seedLocalProviders = async (page: Page, userUuid: string, providers: LocalProvider[]): Promise<void> => {
  await page.addInitScript(
    ({ key, value }) => {
      try {
        window.localStorage.setItem(key, value)
      } catch {
        // about:blank and other origins without storage
      }
    },
    { key: getLocalProvidersKey(userUuid), value: JSON.stringify(providers) }
  )
}

/**
 * Reads the local providers stored for a user in the page.
 * @param {Page} page - The page.
 * @param {string} userUuid - User uuid.
 * @returns {Promise<LocalProvider[]>} The stored providers ([] when none).
 */
export const readLocalProviders = async (page: Page, userUuid: string): Promise<LocalProvider[]> =>
  JSON.parse((await page.evaluate((key) => window.localStorage.getItem(key), getLocalProvidersKey(userUuid))) ?? '[]')
