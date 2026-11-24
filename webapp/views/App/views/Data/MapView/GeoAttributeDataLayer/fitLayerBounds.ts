import type { Map as LeafletMap } from 'leaflet'

/**
 * Zooms the map to the points of a layer.
 * @param {LeafletMap} map - The map.
 * @param {Array} points - GeoJSON points (coordinates are [lng, lat]).
 * @returns {boolean} False (the map is left alone) when there are no points.
 */
export const fitLayerBounds = (map: LeafletMap, points: Array<{ geometry: { coordinates: number[] } }>): boolean => {
  if (points.length === 0) return false
  const latLngs = points.map(({ geometry }): [number, number] => [geometry.coordinates[1], geometry.coordinates[0]])
  map.fitBounds(latLngs, { padding: [32, 32], maxZoom: 16 })
  return true
}
