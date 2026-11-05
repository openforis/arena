import { forward, inverse } from 'mgrs'

import type { GeoBounds, MgrsTilesResult } from './sceneTypes'

export const MAX_SCENE_TILES = 16
export const MAX_SCENE_AREA_SPAN_DEGREES = 10
// 0.25° ≤ 27.8 km: every whole 100 km square (inscribed square ≥ 70.7 km even rotated) gets a sample.
export const TILE_SAMPLING_STEP_DEGREES = 0.25

const EPSILON = 1e-6
const MIN_LATITUDE = -80
const MAX_LATITUDE = 84 - EPSILON
// Multiples of 3° hit every 6° zone edge plus the 3°, 9°, 21° and 33° Norway and Svalbard edges.
const ZONE_EDGE_STEP_DEGREES = 3
const BAND_EDGE_STEP_DEGREES = 8

/**
 * Wraps a longitude into [-180, 180).
 *
 * @param {number} lon - Longitude, any range.
 * @returns {number} Wrapped longitude.
 */
export const normalizeLongitude = (lon: number): number => ((((lon + 180) % 360) + 360) % 360) - 180

/**
 * Returns the 100 km MGRS square at a point, zero-padded like the index `_tile` column (01KAB).
 *
 * @param {number} lon - Longitude, any range.
 * @param {number} lat - Latitude.
 * @returns {string|null} Tile id, or null outside the UTM latitudes.
 */
export const mgrsTileAt = (lon: number, lat: number): string | null => {
  try {
    const reference = forward([normalizeLongitude(lon), lat], 0)
    return reference.length === 4 ? `0${reference}` : reference
  } catch {
    return null
  }
}

/**
 * Lists the multiples of `step` (counted from `origin`) between two values.
 *
 * @param {number} min - Lower value.
 * @param {number} max - Upper value.
 * @param {number} step - Step.
 * @param {number} origin - Origin of the multiples.
 * @returns {number[]} Multiples within [min, max].
 */
const multiplesBetween = (min: number, max: number, step: number, origin: number): number[] => {
  const values: number[] = []
  for (let value = origin + Math.ceil((min - origin) / step) * step; value <= max; value += step) {
    values.push(value)
  }
  return values
}

/**
 * Builds the sample positions of one axis: both ends, a regular step and both sides of every edge.
 *
 * @param {number} min - Lower value.
 * @param {number} max - Upper value.
 * @param {number[]} edges - Grid edges inside the range.
 * @returns {number[]} Sorted sample positions.
 */
const samplingAxis = (min: number, max: number, edges: number[]): number[] => {
  const values = new Set<number>([min, max])
  for (let value = min + TILE_SAMPLING_STEP_DEGREES; value < max; value += TILE_SAMPLING_STEP_DEGREES) {
    values.add(value)
  }
  for (const edge of edges) {
    for (const value of [edge - EPSILON, edge + EPSILON]) {
      if (value >= min && value <= max) values.add(value)
    }
  }
  return [...values].sort((valueA, valueB) => valueA - valueB)
}

/**
 * Collects the tiles of every sample, stopping once there are too many.
 *
 * @param {number[]} lons - Sample longitudes.
 * @param {number[]} lats - Sample latitudes.
 * @returns {string[]|null} Sorted tile ids, or null when there are more than MAX_SCENE_TILES.
 */
const collectTiles = (lons: number[], lats: number[]): string[] | null => {
  const tiles = new Set<string>()
  for (const lat of lats) {
    for (const lon of lons) {
      const tile = mgrsTileAt(lon, lat)
      if (tile) tiles.add(tile)
      if (tiles.size > MAX_SCENE_TILES) return null
    }
  }
  return [...tiles].sort((a, b) => a.localeCompare(b))
}

/**
 * Returns the MGRS 100 km tiles covering a bounding box. East below west means the box crosses the
 * antimeridian.
 *
 * @param {GeoBounds} bounds - Area.
 * @returns {MgrsTilesResult} Tiles, or why there are none (too large, outside the UTM latitudes).
 */
export const getMgrsTilesForBounds = (bounds: GeoBounds): MgrsTilesResult => {
  const { west } = bounds
  const east = bounds.east < west ? bounds.east + 360 : bounds.east
  const south = Math.max(bounds.south, MIN_LATITUDE)
  const north = Math.min(bounds.north, MAX_LATITUDE)
  if (![west, east, south, north].every(Number.isFinite) || south > north) return { status: 'outside' }
  if (east - west > MAX_SCENE_AREA_SPAN_DEGREES || north - south > MAX_SCENE_AREA_SPAN_DEGREES) {
    return { status: 'tooLarge' }
  }
  const lons = samplingAxis(west, east, multiplesBetween(west, east, ZONE_EDGE_STEP_DEGREES, 0))
  const lats = samplingAxis(south, north, multiplesBetween(south, north, BAND_EDGE_STEP_DEGREES, MIN_LATITUDE))
  const tiles = collectTiles(lons, lats)
  if (!tiles) return { status: 'tooLarge' }
  return tiles.length > 0 ? { status: 'ok', tiles } : { status: 'outside' }
}

/**
 * Returns the geographic bounds of a 100 km MGRS square.
 *
 * @param {string} tile - Tile id, e.g. 37MBU or 01KAB.
 * @returns {GeoBounds|null} Bounds, or null for an invalid id.
 */
export const mgrsTileBounds = (tile: string): GeoBounds | null => {
  try {
    const [west, south, east, north] = inverse(tile)
    return { west, south, east, north }
  } catch {
    return null
  }
}
