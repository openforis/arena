import L from 'leaflet'

import { isDataLayer } from './zoomToData'
import type { LatLngLiteral } from './zoomToData'

type LayerOptions = { interactive?: boolean; pane?: string }

/**
 * Collects the points of the data shown on the map: marker positions and the corners of lines and polygons.
 * @param {L.Map} map - The map.
 * @returns {LatLngLiteral[]} The points (may contain duplicates).
 */
export const collectDataLatLngs = (map: L.Map): LatLngLiteral[] => {
  const points: LatLngLiteral[] = []
  map.eachLayer((layer) => {
    const { interactive, pane } = ((layer as L.Layer & { options?: LayerOptions }).options ?? {}) as LayerOptions
    if (!isDataLayer({ isGridLayer: layer instanceof L.GridLayer, interactive, pane })) return
    if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
      const { lat, lng } = layer.getLatLng()
      points.push({ lat, lng })
      return
    }
    if (layer instanceof L.Polyline) {
      // polygons and rectangles are polylines too
      const bounds = layer.getBounds()
      if (bounds.isValid()) points.push(bounds.getSouthWest(), bounds.getNorthEast())
    }
  })
  return points
}
