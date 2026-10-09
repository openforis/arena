/**
 * Lazy loading of the committed handbook: its own webpack chunk, fetched the first time the Help area searches.
 */
import { buildHandbookIndex, type HandbookIndex } from './handbookSearch'
import type { Handbook } from './handbookSplitter'

export type LoadedHandbook = { handbook: Handbook; index: HandbookIndex }

let loading: Promise<LoadedHandbook> | null = null

/**
 * Loads the handbook and builds its index once.
 * @returns {Promise<LoadedHandbook>} The handbook and its index.
 */
export const loadHandbook = (): Promise<LoadedHandbook> => {
  loading ??= import(/* webpackChunkName: "ai-handbook" */ './handbook.json')
    .then((module) => {
      const handbook = ((module as { default?: unknown }).default ?? module) as unknown as Handbook
      return { handbook, index: buildHandbookIndex(handbook) }
    })
    .catch((error) => {
      // a failed chunk load (network) is retried by the next call
      loading = null
      throw error
    })
  return loading
}
