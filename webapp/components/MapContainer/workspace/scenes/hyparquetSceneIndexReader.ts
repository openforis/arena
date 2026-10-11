import { asyncBufferFromUrl, cachedAsyncBuffer, parquetMetadataAsync, parquetReadObjects } from 'hyparquet'
import type { AsyncBuffer, FileMetaData } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

import { readPartLength, SCENE_INDEX_REQUEST_INIT } from './sceneIndexFetch'
import type { FetchLike } from './sceneIndexFetch'
import { getRowGroupInfos, SCENE_INDEX_TILE_COLUMN } from './sceneIndexParts'
import type { RowGroupInfo, SceneIndexReader, SceneIndexRow } from './sceneTypes'

type IndexPart = { file: AsyncBuffer; metadata: FileMetaData; groups: RowGroupInfo[] }

const MAX_CACHED_ROW_GROUPS = 64

/**
 * Opens an index part: size, footer metadata (about 6 MB for a year file) and row-group statistics.
 *
 * @param {string} url - Part URL.
 * @param {FetchLike} fetchImpl - Fetch function.
 * @returns {Promise<IndexPart|null>} The opened part, or null when it does not exist.
 */
const openPart = async (url: string, fetchImpl: FetchLike): Promise<IndexPart | null> => {
  const byteLength = await readPartLength({ url, fetchImpl })
  if (byteLength === null) return null
  const file = cachedAsyncBuffer(
    await asyncBufferFromUrl({ url, byteLength, requestInit: SCENE_INDEX_REQUEST_INIT, fetch: fetchImpl })
  )
  const metadata = await parquetMetadataAsync(file)
  return { file, metadata, groups: getRowGroupInfos(metadata, SCENE_INDEX_TILE_COLUMN) }
}

/**
 * Creates a SceneIndexReader on hyparquet. Opened parts and decoded row groups are cached for the session;
 * a failed read is evicted (with its part) so a retry starts from a fresh footer.
 *
 * @param {FetchLike} [fetchImpl] - Fetch function (defaults to the browser fetch).
 * @returns {SceneIndexReader} Reader.
 */
export const createHyparquetSceneIndexReader = (
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis)
): SceneIndexReader => {
  const parts = new Map<string, Promise<IndexPart | null>>()
  const rowGroups = new Map<string, Promise<SceneIndexRow[]>>()

  /**
   * Returns the cached opened part, opening it on first use.
   *
   * @param {string} url - Part URL.
   * @returns {Promise<IndexPart|null>} The part, or null when it does not exist.
   */
  const getPart = (url: string): Promise<IndexPart | null> => {
    const cached = parts.get(url)
    if (cached) return cached
    const part = openPart(url, fetchImpl)
    parts.set(url, part)
    part.catch(() => parts.delete(url))
    return part
  }

  /**
   * Decodes the requested columns of one row group.
   *
   * @param {string} url - Part URL.
   * @param {RowGroupInfo} group - Row group.
   * @param {string[]} columns - Columns to read.
   * @returns {Promise<SceneIndexRow[]>} Rows.
   */
  const loadRows = async (url: string, group: RowGroupInfo, columns: string[]): Promise<SceneIndexRow[]> => {
    const part = await getPart(url)
    if (!part) return []
    return parquetReadObjects({
      file: part.file,
      metadata: part.metadata,
      columns,
      rowStart: group.rowStart,
      rowEnd: group.rowEnd,
      compressors,
    })
  }

  /**
   * Remembers decoded rows, dropping the oldest entry beyond the cache size.
   *
   * @param {string} key - Cache key.
   * @param {Promise<SceneIndexRow[]>} rows - Rows promise.
   * @returns {void}
   */
  const rememberRows = (key: string, rows: Promise<SceneIndexRow[]>): void => {
    rowGroups.set(key, rows)
    if (rowGroups.size > MAX_CACHED_ROW_GROUPS) {
      const [oldestKey] = rowGroups.keys()
      rowGroups.delete(oldestKey)
    }
  }

  return {
    readRowGroups: async (url) => (await getPart(url))?.groups ?? null,
    readRows: (url, group, columns) => {
      const key = `${url}#${group.rowStart}#${columns.join(',')}`
      const cached = rowGroups.get(key)
      if (cached) return cached
      const rows = loadRows(url, group, columns)
      rememberRows(key, rows)
      rows.catch(() => {
        rowGroups.delete(key)
        parts.delete(url)
      })
      return rows
    },
  }
}
