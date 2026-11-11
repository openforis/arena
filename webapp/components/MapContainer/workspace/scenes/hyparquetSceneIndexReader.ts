import { asyncBufferFromUrl, cachedAsyncBuffer, parquetMetadataAsync, parquetReadObjects } from 'hyparquet'
import type { AsyncBuffer, FileMetaData } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

import { readPartLength, SCENE_INDEX_REQUEST_INIT } from './sceneIndexFetch'
import type { FetchLike } from './sceneIndexFetch'
import { createSceneIndexCache } from './sceneIndexCache'
import { getRowGroupInfos, SCENE_INDEX_TILE_COLUMN } from './sceneIndexParts'
import { compactSceneRow } from './sceneRows'
import type { RowGroupInfo, SceneIndexReader, SceneIndexRow } from './sceneTypes'

type IndexPart = { file: AsyncBuffer; metadata: FileMetaData; groups: RowGroupInfo[] }

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
  const file = await asyncBufferFromUrl({ url, byteLength, requestInit: SCENE_INDEX_REQUEST_INIT, fetch: fetchImpl })
  // Byte ranges are cached only while the footer is read: row reads use the plain buffer, because the
  // decoded-row cache already prevents re-reads and the byte cache would grow without bound.
  const metadata = await parquetMetadataAsync(cachedAsyncBuffer(file))
  return { file, metadata, groups: getRowGroupInfos(metadata, SCENE_INDEX_TILE_COLUMN) }
}

/**
 * Decodes the requested columns of one row group into compact rows.
 *
 * @param {IndexPart} part - Opened part.
 * @param {RowGroupInfo} group - Row group.
 * @param {string[]} columns - Columns to read.
 * @returns {Promise<SceneIndexRow[]>} Compact rows (primitive values only).
 */
const loadRows = async (part: IndexPart, group: RowGroupInfo, columns: string[]): Promise<SceneIndexRow[]> => {
  const rows = await parquetReadObjects({
    file: part.file,
    metadata: part.metadata,
    columns,
    rowStart: group.rowStart,
    rowEnd: group.rowEnd,
    compressors,
  })
  return rows.map((row) => compactSceneRow(row, columns))
}

/**
 * Creates a SceneIndexReader on hyparquet. Opened parts and compact decoded row groups are cached for the
 * session (see createSceneIndexCache).
 *
 * @param {FetchLike} [fetchImpl] - Fetch function (defaults to the browser fetch).
 * @returns {SceneIndexReader} Reader.
 */
export const createHyparquetSceneIndexReader = (
  fetchImpl: FetchLike = globalThis.fetch.bind(globalThis)
): SceneIndexReader => createSceneIndexCache({ openPart: (url) => openPart(url, fetchImpl), loadRows })
