/**
 * Lazy loading of the committed handbooks (one per manual language): each one is its own webpack chunk, fetched
 * the first time the Help area searches.
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

// one loader per language of the manual (HANDBOOK_LANGS)
const loaders: Record<string, () => Promise<LoadedHandbook>> = {
  en: createHandbookLoader(() => import(/* webpackChunkName: "ai-handbook-en" */ './handbook-en.json')),
  fr: createHandbookLoader(() => import(/* webpackChunkName: "ai-handbook-fr" */ './handbook-fr.json')),
  es: createHandbookLoader(() => import(/* webpackChunkName: "ai-handbook-es" */ './handbook-es.json')),
}

/**
 * Loads the handbook in the interface language (in English when the manual isn't translated into it) and builds
 * its index once.
 * @param {string} uiLang - Interface language (e.g. "fr").
 * @returns {Promise<LoadedHandbook>} The handbook and its index.
 */
export const loadHandbook = (uiLang: string): Promise<LoadedHandbook> =>
  (loaders[uiLang?.split('-')[0]] ?? loaders.en)()
