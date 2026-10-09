/**
 * Lazy loading of the committed handbook: its own webpack chunk, fetched the first time the Help area searches.
 */
import { buildHandbookIndex, type HandbookIndex } from './handbookSearch'
import type { Handbook } from './handbookSplitter'

export type LoadedHandbook = { handbook: Handbook; index: HandbookIndex }

type HandbookImporter = () => Promise<unknown>

/**
 * Creates a loader that imports the handbook and builds its index once (the importer is injectable for tests).
 * @param {HandbookImporter} importer - Imports the handbook module.
 * @returns {Function} The loader.
 */
export const createHandbookLoader = (importer: HandbookImporter): (() => Promise<LoadedHandbook>) => {
  let loading: Promise<LoadedHandbook> | null = null
  return () => {
    loading ??= importer()
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
}

/**
 * Loads the handbook and builds its index once.
 * @returns {Promise<LoadedHandbook>} The handbook and its index.
 */
export const loadHandbook = createHandbookLoader(() => import(/* webpackChunkName: "ai-handbook" */ './handbook.json'))
