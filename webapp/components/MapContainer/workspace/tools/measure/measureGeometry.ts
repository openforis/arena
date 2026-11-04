import area from '@turf/area'
import { lineString, polygon } from '@turf/helpers'
import length from '@turf/length'

import type { LatLngLike, LatLngPair } from '@webapp/components/MapContainer/workspace/tools/measure/measureTypes'

export const MIN_LINE_VERTICES = 2
export const MIN_POLYGON_VERTICES = 3

/**
 * Tells whether a value looks like a Leaflet LatLng.
 * @param {unknown} value - The value to check.
 * @returns {boolean} True when the value is an object with finite lat and lng numbers.
 */
const isLatLngLike = (value: unknown): value is LatLngLike => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const { lat, lng } = value as LatLngLike
  return Number.isFinite(lat) && Number.isFinite(lng)
}

/**
 * Converts Leaflet lat/lngs (one point, a list, or polygon rings) into the [lat, lng] pairs of the first ring.
 * @param {unknown} input - A LatLng, an array of LatLng, or an array of rings (polygon getLatLngs()).
 * @returns {LatLngPair[]} The pairs; invalid entries are skipped.
 */
export const toLatLngPairs = (input: unknown): LatLngPair[] => {
  if (isLatLngLike(input)) return [[input.lat, input.lng]]
  if (!Array.isArray(input)) return []
  const ring: unknown[] = Array.isArray(input[0]) ? input[0] : input
  const pairs: LatLngPair[] = []
  for (const item of ring) {
    if (isLatLngLike(item)) pairs.push([item.lat, item.lng])
  }
  return pairs
}

/**
 * Tells whether two pairs are the same point.
 * @param {LatLngPair} pairA - First point.
 * @param {LatLngPair} pairB - Second point.
 * @returns {boolean} True when latitude and longitude are equal.
 */
const samePoint = (pairA: LatLngPair, pairB: LatLngPair): boolean => pairA[0] === pairB[0] && pairA[1] === pairB[1]

/**
 * Returns the open ring of a polygon: repeated consecutive vertices and a closing vertex equal to the first are dropped.
 * @param {LatLngPair[]} vertices - The polygon vertices, closed or not.
 * @returns {LatLngPair[]} The distinct vertices of the open ring.
 */
export const toOpenRing = (vertices: LatLngPair[]): LatLngPair[] => {
  const ring: LatLngPair[] = []
  for (const vertex of vertices) {
    const last = ring.at(-1)
    if (!last || !samePoint(last, vertex)) ring.push(vertex)
  }
  const tail = ring.at(-1)
  if (ring.length > 1 && tail && samePoint(ring[0], tail)) ring.pop()
  return ring
}

/**
 * Converts [lat, lng] pairs into GeoJSON [lng, lat] positions.
 * @param {LatLngPair[]} pairs - The pairs.
 * @returns {number[][]} The GeoJSON positions.
 */
const toPositions = (pairs: LatLngPair[]): number[][] => pairs.map(([lat, lng]) => [lng, lat])

/**
 * Measures the geodesic length of a path.
 * @param {LatLngPair[]} vertices - The path vertices.
 * @returns {number} The length in meters (0 with fewer than 2 vertices).
 */
export const measureLength = (vertices: LatLngPair[]): number =>
  vertices.length < MIN_LINE_VERTICES ? 0 : length(lineString(toPositions(vertices)), { units: 'meters' })

/**
 * Measures the geodesic area of a polygon.
 * @param {LatLngPair[]} vertices - The polygon vertices, closed or not.
 * @returns {number|null} The area in square meters, or null with fewer than 3 distinct vertices.
 */
export const measureArea = (vertices: LatLngPair[]): number | null => {
  const ring = toOpenRing(vertices)
  if (ring.length < MIN_POLYGON_VERTICES) return null
  const positions = toPositions(ring)
  return area(polygon([[...positions, positions[0]]]))
}

/**
 * Measures the geodesic perimeter of a polygon.
 * @param {LatLngPair[]} vertices - The polygon vertices, closed or not.
 * @returns {number|null} The perimeter in meters, or null with fewer than 3 distinct vertices.
 */
export const measurePerimeter = (vertices: LatLngPair[]): number | null => {
  const ring = toOpenRing(vertices)
  if (ring.length < MIN_POLYGON_VERTICES) return null
  return measureLength([...ring, ring[0]])
}
