import { useCallback, useEffect, useState } from 'react'

import { isAbortError, searchScenes } from './sceneSearch'
import type { SceneIndexReader, ScenePeriod, SceneResult } from './sceneTypes'

export type SceneSearchState = {
  scenes: SceneResult[] // last finished search; kept while a newer one runs
  loading: boolean
  failed: boolean
  retry: () => void
}

type FinishedSearch = { key: string; scenes: SceneResult[]; failed: boolean }

const NO_SCENES: SceneResult[] = []

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
  const requestKey = tiles.length > 0 ? getRequestKey(tiles, period, attempt) : null

  useEffect(() => {
    if (tiles.length === 0) return undefined
    const key = getRequestKey(tiles, period, attempt)
    const controller = new AbortController()
    loadSceneIndexReader()
      .then((reader) => searchScenes({ reader, tiles, period, signal: controller.signal }))
      .then((scenes) => {
        if (!controller.signal.aborted) setFinished({ key, scenes, failed: false })
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !isAbortError(error)) setFinished({ key, scenes: NO_SCENES, failed: true })
      })
    return () => controller.abort()
  }, [attempt, period, tiles])

  const retry = useCallback((): void => setAttempt((value) => value + 1), [])

  if (requestKey === null) return { scenes: NO_SCENES, loading: false, failed: false, retry }
  const current = finished?.key === requestKey ? finished : null
  return {
    scenes: finished?.scenes ?? NO_SCENES,
    loading: current === null,
    failed: current?.failed ?? false,
    retry,
  }
}
