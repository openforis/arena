import { warpLonLatToEqualEarthInMercator, type LonLat } from './equalEarthProjection'

export interface BlendZoomRange {
  start: number
  end: number
}

/**
 * The zoom range the Equal Earth base layer blends over: fully warped at or below
 * `start`, fully true position at or above `end`.
 */
export const DEFAULT_BLEND_ZOOM_RANGE: BlendZoomRange = { start: 4, end: 8 }

export type Position = number[]
export type CoordinateTree = Position | CoordinateTree[]

export interface CountryFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: { type: string; coordinates: CoordinateTree }
}

export interface CountryFeatureCollection {
  type: 'FeatureCollection'
  features: CountryFeature[]
}

const isPosition = (value: CoordinateTree): value is Position => Array.isArray(value) && typeof value[0] === 'number'

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/**
 * Returns how much of the Equal Earth warp should be applied at a given zoom level.
 * @param {number} zoom - The current map zoom level.
 * @param {BlendZoomRange} range - The zoom range the blend spans.
 * @returns {number} 1 at or below `range.start` (fully warped), 0 at or above
 * `range.end` (true position), linearly interpolated in between.
 */
export const getBlendFactor = (zoom: number, range: BlendZoomRange): number => {
  if (zoom <= range.start) return 1
  if (zoom >= range.end) return 0
  return (range.end - zoom) / (range.end - range.start)
}

/**
 * Blends a single true longitude/latitude toward its Equal Earth-warped position.
 * @param {LonLat} lonLat - The true (unwarped) longitude/latitude.
 * @param {number} blend - How much warp to apply, from 0 (true position) to 1 (fully warped).
 * @returns {LonLat} The blended longitude/latitude.
 */
export const blendLonLat = (lonLat: LonLat, blend: number): LonLat => {
  if (blend <= 0) return lonLat
  const warped = warpLonLatToEqualEarthInMercator(lonLat)
  return { lon: lerp(lonLat.lon, warped.lon, blend), lat: lerp(lonLat.lat, warped.lat, blend) }
}

const blendCoordinateTree = (coordinates: CoordinateTree, blend: number): CoordinateTree => {
  if (isPosition(coordinates)) {
    const [lon, lat] = coordinates
    const blended = blendLonLat({ lon, lat }, blend)
    return [blended.lon, blended.lat]
  }
  return coordinates.map((coordinate) => blendCoordinateTree(coordinate, blend))
}

/**
 * Blends every coordinate in a country FeatureCollection toward its Equal Earth-warped
 * position, by the given amount.
 * @param {CountryFeatureCollection} trueData - The true (unwarped) country FeatureCollection.
 * @param {number} blend - How much warp to apply, from 0 (true position) to 1 (fully warped).
 * @returns {CountryFeatureCollection} A new FeatureCollection with blended coordinates.
 */
export const blendCountryFeatureCollection = (
  trueData: CountryFeatureCollection,
  blend: number
): CountryFeatureCollection => ({
  ...trueData,
  features: trueData.features.map((feature) => ({
    ...feature,
    geometry: { ...feature.geometry, coordinates: blendCoordinateTree(feature.geometry.coordinates, blend) },
  })),
})
