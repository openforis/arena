import { sortScenes } from './sceneFilters'
import { getIndexPartUrls, selectRowGroups } from './sceneIndexParts'
import { isInPeriod } from './scenePeriod'
import { dedupeScenes, parseSceneRow, SCENE_INDEX_COLUMNS } from './sceneRows'
import type { SceneIndexReader, SceneIndexRow, ScenePeriod, SceneResult } from './sceneTypes'

export type SearchScenesParams = {
  reader: SceneIndexReader
  tiles: string[]
  period: ScenePeriod
  signal?: AbortSignal
  baseUrl?: string
}

type ReadPartParams = { reader: SceneIndexReader; url: string; tiles: string[]; signal?: AbortSignal }

/**
 * Tells whether an error comes from a cancelled search.
 *
 * @param {unknown} error - Error.
 * @returns {boolean} True for an AbortError.
 */
export const isAbortError = (error: unknown): boolean => (error as { name?: unknown } | null)?.name === 'AbortError'

/**
 * Throws an AbortError when the signal is aborted.
 *
 * @param {AbortSignal} [signal] - Signal.
 * @returns {void}
 */
const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) throw new DOMException('The Sentinel-2 scene search was cancelled.', 'AbortError')
}

/**
 * Reads the rows of one index part that may hold the tiles; a missing part has no rows.
 *
 * @param {ReadPartParams} params - Reader, part URL, tiles and abort signal.
 * @returns {Promise<SceneIndexRow[]>} Rows of the selected row groups.
 */
const readPartRows = async ({ reader, url, tiles, signal }: ReadPartParams): Promise<SceneIndexRow[]> => {
  const groups = await reader.readRowGroups(url)
  throwIfAborted(signal)
  if (!groups) return []
  const chunks = await Promise.all(
    selectRowGroups(groups, tiles).map((group) => reader.readRows(url, group, SCENE_INDEX_COLUMNS))
  )
  throwIfAborted(signal)
  return chunks.flat()
}

/**
 * Turns rows into scenes of the wanted tiles and period (row groups also hold neighbouring tiles).
 *
 * @param {SceneIndexRow[]} rows - Rows.
 * @param {Set<string>} tiles - Wanted tile ids.
 * @param {ScenePeriod} period - Period.
 * @returns {SceneResult[]} Scenes.
 */
const toScenes = (rows: SceneIndexRow[], tiles: Set<string>, period: ScenePeriod): SceneResult[] => {
  const scenes: SceneResult[] = []
  for (const row of rows) {
    const scene = tiles.has(row._tile as string) ? parseSceneRow(row) : null
    if (scene && isInPeriod(scene.datetime, period)) scenes.push(scene)
  }
  return scenes
}

/**
 * Searches the scenes of some MGRS tiles in a period. Parts are read in parallel; items files come before
 * the live tails of their year, so the freshest copy of a duplicated scene wins.
 *
 * @param {SearchScenesParams} params - Reader, tiles, period, optional abort signal and index root.
 * @returns {Promise<SceneResult[]>} Unique scenes, newest first; rejects with an AbortError when cancelled.
 */
export const searchScenes = async ({
  reader,
  tiles,
  period,
  signal,
  baseUrl,
}: SearchScenesParams): Promise<SceneResult[]> => {
  throwIfAborted(signal)
  if (tiles.length === 0) return []
  const parts = await Promise.all(
    getIndexPartUrls(period, baseUrl).map((url) => readPartRows({ reader, url, tiles, signal }))
  )
  throwIfAborted(signal)
  return sortScenes(dedupeScenes(toScenes(parts.flat(), new Set(tiles), period)), 'newest')
}
