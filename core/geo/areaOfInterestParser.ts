import type { AreaOfInterest } from '@openforis/arena-core'
import type { Position } from 'geojson'

type GeoJsonObject = {
  type?: string
  coordinates?: unknown
  geometry?: unknown
  features?: unknown
}

const isPosition = (value: unknown): value is Position => {
  if (!Array.isArray(value) || value.length < 2) return false
  const [x, y] = value
  return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) <= 180 && Math.abs(y) <= 90
}

// a linear ring has at least 4 positions (the last one equal to the first one)
const isLinearRing = (value: unknown): value is Position[] =>
  Array.isArray(value) && value.length >= 4 && value.every(isPosition)

const isPolygonCoordinates = (value: unknown): value is Position[][] =>
  Array.isArray(value) && value.length > 0 && value.every(isLinearRing)

// returns the polygons (as list of rings) of a Polygon or MultiPolygon geometry, or null if not valid
const extractPolygonsFromGeometry = (geometry: unknown): Position[][][] | null => {
  const { type, coordinates } = (geometry ?? {}) as GeoJsonObject
  if (type === 'Polygon') {
    return isPolygonCoordinates(coordinates) ? [coordinates] : null
  }
  if (type === 'MultiPolygon') {
    return Array.isArray(coordinates) && coordinates.length > 0 && coordinates.every(isPolygonCoordinates)
      ? coordinates
      : null
  }
  return null
}

const extractPolygons = (geoJson: unknown): Position[][][] | null => {
  const { type, geometry, features } = (geoJson ?? {}) as GeoJsonObject
  if (type === 'Feature') return extractPolygonsFromGeometry(geometry)
  if (type === 'FeatureCollection') {
    if (!Array.isArray(features)) return null
    // features with other geometry types (e.g. points or lines) are ignored
    const polygons = features.flatMap((feature) => extractPolygons(feature) ?? [])
    return polygons.length > 0 ? polygons : null
  }
  return extractPolygonsFromGeometry(geoJson)
}

/**
 * Extracts the area of interest from a GeoJSON object (Polygon or MultiPolygon geometry, Feature or FeatureCollection).
 *
 * @param {unknown} geoJson - The GeoJSON object.
 * @returns {AreaOfInterest|null} - A Polygon (single polygon) or MultiPolygon geometry, or null if no valid polygon is found.
 */
export const parseAreaOfInterest = (geoJson: unknown): AreaOfInterest | null => {
  const polygons = extractPolygons(geoJson)
  if (!polygons) return null
  return polygons.length === 1
    ? { type: 'Polygon', coordinates: polygons[0] }
    : { type: 'MultiPolygon', coordinates: polygons }
}

/**
 * Extracts the area of interest from the text of a GeoJSON file.
 *
 * @param {string} text - The GeoJSON text.
 * @returns {AreaOfInterest|null} - The area of interest or null if the text is not valid JSON or has no valid polygon.
 */
export const parseAreaOfInterestJson = (text: string): AreaOfInterest | null => {
  try {
    return parseAreaOfInterest(JSON.parse(text))
  } catch {
    // not a valid JSON text
    return null
  }
}

/**
 * Returns the number of polygons and vertices of an area of interest.
 *
 * @param {AreaOfInterest} areaOfInterest - The area of interest.
 * @returns {{polygons: number, vertices: number}} - Number of polygons and vertices.
 */
export const getAreaOfInterestSummary = (areaOfInterest: AreaOfInterest): { polygons: number; vertices: number } => {
  const polygons = areaOfInterest.type === 'Polygon' ? [areaOfInterest.coordinates] : areaOfInterest.coordinates
  const vertices = polygons.reduce((acc, rings) => acc + rings.reduce((accRings, ring) => accRings + ring.length, 0), 0)
  return { polygons: polygons.length, vertices }
}
