import { normalizeLongitude } from './coordinateFormat'

export type ScaleBar = { meters: number; widthPx: number; label: string }

export type LatLngBoundsLiteral = { south: number; west: number; north: number; east: number }

// equatorial circumference of the Web Mercator sphere, in metres
const EARTH_CIRCUMFERENCE_M = 40075016.686
const TILE_SIZE_POWER = 8 // 256 px tiles
const NICE_MULTIPLIERS = [1, 2, 5]

/**
 * Returns the ground resolution of a Web Mercator map.
 * @param {number} lat - Latitude in degrees.
 * @param {number} zoom - Zoom level.
 * @returns {number} Metres per screen pixel.
 */
export const metersPerPixel = (lat: number, zoom: number): number =>
  (EARTH_CIRCUMFERENCE_M * Math.cos((lat * Math.PI) / 180)) / 2 ** (zoom + TILE_SIZE_POWER)

/**
 * Formats a length in metres, switching to km from 1000 m.
 * @param {number} meters - Length in metres.
 * @returns {string} The label, e.g. "200 m" or "5 km".
 */
const formatScaleLength = (meters: number): string => (meters >= 1000 ? `${meters / 1000} km` : `${meters} m`)

/**
 * Picks the longest "nice" length (1, 2 or 5 × 10^k metres) that fits in the given width.
 * @param {number} metersPerPx - Ground resolution.
 * @param {number} [maxWidthPx] - Maximum width of the bar in pixels.
 * @returns {ScaleBar|null} The bar length, its width in pixels and its label, or null for an invalid resolution.
 */
export const getScaleBar = (metersPerPx: number, maxWidthPx = 100): ScaleBar | null => {
  if (!Number.isFinite(metersPerPx) || metersPerPx <= 0 || maxWidthPx <= 0) return null
  const maxMeters = metersPerPx * maxWidthPx
  const magnitude = 10 ** Math.floor(Math.log10(maxMeters))
  let meters = magnitude
  for (const multiplier of NICE_MULTIPLIERS) {
    if (multiplier * magnitude <= maxMeters) meters = multiplier * magnitude
  }
  return { meters, widthPx: Math.round(meters / metersPerPx), label: formatScaleLength(meters) }
}

/**
 * Tells whether a longitude is inside a west-east range, also when the range crosses the antimeridian.
 * @param {number} lng - Longitude in degrees.
 * @param {number} west - West edge in degrees (may be below -180).
 * @param {number} east - East edge in degrees (may be above 180).
 * @returns {boolean} True when inside.
 */
export const isLngInRange = (lng: number, west: number, east: number): boolean => {
  if (east - west >= 360) return true
  const lon = normalizeLongitude(lng)
  const w = normalizeLongitude(west)
  const e = normalizeLongitude(east)
  return w <= e ? lon >= w && lon <= e : lon >= w || lon <= e
}

/**
 * Counts the points inside the given bounds.
 * @param {Array<{lat: number, lng: number}>} points - Points.
 * @param {LatLngBoundsLiteral} bounds - Bounds (Leaflet's map.getBounds() values).
 * @returns {number} Number of points inside.
 */
export const countPointsInBounds = (
  points: Array<{ lat: number; lng: number }>,
  bounds: LatLngBoundsLiteral
): number => {
  let count = 0
  for (const { lat, lng } of points) {
    if (lat >= bounds.south && lat <= bounds.north && isLngInRange(lng, bounds.west, bounds.east)) count += 1
  }
  return count
}
