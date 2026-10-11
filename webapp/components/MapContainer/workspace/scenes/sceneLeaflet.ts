import L from 'leaflet'

import type { GeoBounds } from './sceneTypes'

// Selected scene footprint: dashed blue (mockup "Main"); drawn search area: dotted dark.
export const SCENE_FOOTPRINT_STYLE: L.PathOptions = {
  color: '#3885ca',
  weight: 2,
  dashArray: '6 4',
  fill: false,
  interactive: false,
}
export const SCENE_DRAWN_AREA_STYLE: L.PathOptions = {
  color: '#2f3138',
  weight: 2,
  dashArray: '2 4',
  fill: false,
  interactive: false,
}

/**
 * Converts Leaflet bounds to plain bounds.
 *
 * @param {L.LatLngBounds} bounds - Leaflet bounds.
 * @returns {GeoBounds} Plain bounds (longitudes may leave [-180, 180]).
 */
export const toGeoBounds = (bounds: L.LatLngBounds): GeoBounds => ({
  west: bounds.getWest(),
  south: bounds.getSouth(),
  east: bounds.getEast(),
  north: bounds.getNorth(),
})

/**
 * Reads the bounds of the map view.
 *
 * @param {L.Map} map - Map.
 * @returns {GeoBounds|null} View bounds, or null before the map has a view.
 */
export const readViewBounds = (map: L.Map): GeoBounds | null => {
  try {
    return toGeoBounds(map.getBounds())
  } catch {
    return null
  }
}

/**
 * Adds a non-interactive outline that Geoman ignores (it must not become editable or measurable).
 *
 * @param {L.Map} map - Map.
 * @param {GeoBounds} bounds - Outline bounds.
 * @param {L.PathOptions} style - Path style.
 * @returns {L.Rectangle} The outline layer (remove it on cleanup).
 */
export const addSceneOutline = (map: L.Map, bounds: GeoBounds, style: L.PathOptions): L.Rectangle =>
  L.rectangle(L.latLngBounds([bounds.south, bounds.west], [bounds.north, bounds.east]), {
    ...style,
    pmIgnore: true,
  }).addTo(map)
