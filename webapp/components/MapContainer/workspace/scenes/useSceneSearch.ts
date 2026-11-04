import { useCallback, useEffect, useState } from 'react'

import type { FinishedSearch } from './sceneSearch'
import { failSearch, finishSearch, getSearchView, searchScenes } from './sceneSearch'
import type { SceneIndexReader, ScenePeriod, SceneResult } from './sceneTypes'

export type SceneSearchState = {
  scenes: SceneResult[] // last finished search; kept while a newer one runs
  loading: boolean
  failed: boolean
  retry: () => void
}

// One reader per session: it caches footers and row groups across searches and panel remounts.
let readerPromise: Promise<SceneIndexReader> | null = null

/**
 * Loads the hyparquet reader chunk once; a failed load is retried next time.
 *
 * @returns {Promise<SceneIndexReader>} Reader.
 */
const loadSceneIndexReader = (): Promise<SceneIndexReader> => {
  if (!readerPromise) {
    readerPromise = import('./hyparquetSceneIndexReader').then((module) => module.createHyparquetSceneIndexReader())
    readerPromise.catch(() => {
      readerPromise = null
    })
  }
  return readerPromise
}

/**
 * Drops the session reader (parsed footers and cached rows) so the memory is released. The next search
 * loads a fresh one.
 *
 * @returns {void}
 */
export const releaseSceneIndexReader = (): void => {
  readerPromise = null
}

/**
 * Builds the key that identifies a search request.
 *
 * @param {string[]} tiles - Tiles.
 * @param {ScenePeriod} period - Period.
 * @param {number} attempt - Retry counter.
 * @returns {string} Request key.
 */
const getRequestKey = (tiles: string[], period: ScenePeriod, attempt: number): string =>
  `${tiles.join(',')}|${period.start.toISOString()}|${attempt}`

/**
 * Searches the scenes of the tiles and period. A newer request aborts the older one.
 *
 * @param {object} params - Parameters.
 * @param {string[]} params.tiles - Tiles to search (stable array; empty = no search).
 * @param {ScenePeriod} params.period - Period (stable object).
 * @returns {SceneSearchState} Search state.
 */
export const useSceneSearch = ({ tiles, period }: { tiles: string[]; period: ScenePeriod }): SceneSearchState => {
  const [attempt, setAttempt] = useState(0)
  const [finished, setFinished] = useState<FinishedSearch | null>(null)
  // The reader caches tens of MB: release it when the map workspace goes away.
  useEffect(() => releaseSceneIndexReader, [])
  const requestKey = tiles.length > 0 ? getRequestKey(tiles, period, attempt) : null

  useEffect(() => {
    if (tiles.length === 0) return undefined
    const key = getRequestKey(tiles, period, attempt)
    const controller = new AbortController()
    loadSceneIndexReader()
      .then((reader) => searchScenes({ reader, tiles, period, signal: controller.signal }))
      .then((scenes) => finishSearch(controller.signal, key, scenes))
      .catch((error: unknown) => failSearch(controller.signal, key, error))
      .then((result) => {
        if (result) setFinished(result)
      })
    return () => controller.abort()
  }, [attempt, period, tiles])

  const retry = useCallback((): void => setAttempt((value) => value + 1), [])

  return { ...getSearchView(requestKey, finished), retry }
}
