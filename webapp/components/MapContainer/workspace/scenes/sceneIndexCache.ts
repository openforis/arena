import type { RowGroupInfo, SceneIndexReader, SceneIndexRow } from './sceneTypes'

export const MAX_CACHED_ROW_GROUPS = 16

type CachedPart = { groups: RowGroupInfo[] }

export type SceneIndexCacheDeps<P extends CachedPart> = {
  openPart: (url: string) => Promise<P | null> // null = the part does not exist
  loadRows: (part: P, group: RowGroupInfo, columns: string[]) => Promise<SceneIndexRow[]>
  maxRowGroups?: number
}

/**
 * Creates a SceneIndexReader that caches opened parts and decoded row groups for the session. A failed
 * open or read is evicted (with its part and row groups) so a retry starts from a fresh footer; a missing
 * part (null) stays cached. Pure: file access is injected.
 *
 * @param {SceneIndexCacheDeps} deps - Part opener, row loader and optional row-group cap.
 * @returns {SceneIndexReader} Reader.
 */
export const createSceneIndexCache = <P extends CachedPart>({
  openPart,
  loadRows,
  maxRowGroups = MAX_CACHED_ROW_GROUPS,
}: SceneIndexCacheDeps<P>): SceneIndexReader => {
  const parts = new Map<string, Promise<P | null>>()
  const rowGroups = new Map<string, Promise<SceneIndexRow[]>>()

  /**
   * Drops a part and all its cached row groups, so a retry never pairs stale rows with a fresh footer.
   *
   * @param {string} url - Part URL.
   * @returns {void}
   */
  const evictPart = (url: string): void => {
    parts.delete(url)
    for (const key of rowGroups.keys()) {
      if (key.startsWith(`${url}#`)) rowGroups.delete(key)
    }
  }

  /**
   * Returns the cached opened part, opening it on first use.
   *
   * @param {string} url - Part URL.
   * @returns {Promise<P|null>} The part, or null when it does not exist.
   */
  const getPart = (url: string): Promise<P | null> => {
    const cached = parts.get(url)
    if (cached !== undefined) return cached
    const part = openPart(url)
    parts.set(url, part)
    part.catch(() => evictPart(url))
    return part
  }

  /**
   * Loads a row group, after checking that the current footer still describes the same rows.
   *
   * @param {string} url - Part URL.
   * @param {RowGroupInfo} group - Row group.
   * @param {string[]} columns - Columns to read.
   * @returns {Promise<SceneIndexRow[]>} Rows.
   */
  const loadChecked = async (url: string, group: RowGroupInfo, columns: string[]): Promise<SceneIndexRow[]> => {
    const part = await getPart(url)
    if (!part) return []
    const current = part.groups.find((candidate) => candidate.index === group.index)
    // The group came from an older footer: reading it here would return other rows.
    if (current?.rowStart !== group.rowStart || current.rowEnd !== group.rowEnd) {
      throw new Error(`Row group ${group.index} of ${url} changed since its footer was read.`)
    }
    return loadRows(part, group, columns)
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
    if (rowGroups.size > maxRowGroups) {
      const [oldestKey] = rowGroups.keys()
      rowGroups.delete(oldestKey)
    }
  }

  return {
    readRowGroups: async (url) => (await getPart(url))?.groups ?? null,
    readRows: (url, group, columns) => {
      const key = `${url}#${group.rowStart}#${columns.join(',')}`
      const cached = rowGroups.get(key)
      if (cached !== undefined) return cached
      const rows = loadChecked(url, group, columns)
      rememberRows(key, rows)
      rows.catch(() => evictPart(url))
      return rows
    },
  }
}
