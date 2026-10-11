import type { SceneIndexRow, SceneResult } from './sceneTypes'

// `thumbnail_url` is a top-level column, so the heavy `assets` struct is never read.
export const SCENE_INDEX_COLUMNS = [
  'id',
  'datetime',
  'eo:cloud_cover',
  's2:nodata_pixel_percentage',
  'thumbnail_url',
  '_tile',
]

/**
 * Returns a finite number clamped to 0–100, or null when the value is not a finite number.
 *
 * @param {unknown} value - Raw value.
 * @returns {number|null} Percentage or null.
 */
const toPercent = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.min(100, Math.max(0, value))
}

/**
 * Parses `eo:cloud_cover`.
 *
 * @param {unknown} value - Raw value.
 * @returns {number|null} Cloud cover 0–100, or null when unknown.
 */
export const parseCloudCover = (value: unknown): number | null => toPercent(value)

/**
 * Turns `s2:nodata_pixel_percentage` into coverage (100 − nodata).
 *
 * @param {unknown} nodata - Raw nodata percentage.
 * @returns {number|null} Coverage 0–100, or null when unknown.
 */
export const parseCoverage = (nodata: unknown): number | null => {
  const percent = toPercent(nodata)
  return percent === null ? null : 100 - percent
}

/**
 * Converts a Date, ISO string or epoch milliseconds into a valid Date.
 *
 * @param {unknown} value - Raw datetime.
 * @returns {Date|null} Valid date or null.
 */
const toValidDate = (value: unknown): Date | null => {
  let date: Date | null = null
  if (value instanceof Date) date = value
  else if (typeof value === 'string' || typeof value === 'number') date = new Date(value)
  return date && Number.isFinite(date.getTime()) ? date : null
}

/**
 * Tells whether a value is a non-empty string.
 *
 * @param {unknown} value - Value.
 * @returns {boolean} True for a non-empty string.
 */
const isFilledString = (value: unknown): value is string => typeof value === 'string' && value !== ''

/**
 * Parses an index row into a scene; rows without a usable id, tile or datetime are dropped.
 *
 * @param {SceneIndexRow} row - Row with the SCENE_INDEX_COLUMNS.
 * @returns {SceneResult|null} Scene, or null when the row is unusable.
 */
export const parseSceneRow = (row: SceneIndexRow): SceneResult | null => {
  const { id, _tile: tile, thumbnail_url: thumbnailUrl } = row
  const date = toValidDate(row.datetime)
  if (!isFilledString(id) || !isFilledString(tile) || !date) return null
  const datetime = date.toISOString()
  return {
    id,
    datetime,
    date: datetime.slice(0, 10),
    tile,
    cloud: parseCloudCover(row['eo:cloud_cover']),
    coverage: parseCoverage(row['s2:nodata_pixel_percentage']),
    thumbnailUrl: isFilledString(thumbnailUrl) ? thumbnailUrl : null,
  }
}

/**
 * Removes duplicated ids. Parts are read items first, then live tails, so the last copy (the freshest)
 * wins; it keeps the position of the first copy.
 *
 * @param {SceneResult[]} scenes - Scenes, possibly duplicated.
 * @returns {SceneResult[]} Unique scenes.
 */
export const dedupeScenes = (scenes: SceneResult[]): SceneResult[] => {
  const byId = new Map<string, SceneResult>()
  for (const scene of scenes) {
    byId.set(scene.id, scene)
  }
  return [...byId.values()]
}
