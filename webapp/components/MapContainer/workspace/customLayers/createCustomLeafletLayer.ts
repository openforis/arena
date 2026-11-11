import L from 'leaflet'

import type { MapCustomLayer } from '@core/map/customLayers/mapCustomLayer'
import { getCustomLayerLeafletConfig } from '@webapp/components/MapContainer/workspace/customLayers/customLayerLeaflet'

/**
 * Creates the Leaflet layer of a custom overlay (registered in the overlay registry, so not a react-leaflet child).
 * @param {MapCustomLayer} layer - The layer.
 * @returns {L.TileLayer} A WMS tile layer, or a tile layer for WMTS and XYZ templates.
 */
export const createCustomLeafletLayer = (layer: MapCustomLayer): L.TileLayer => {
  const config = getCustomLayerLeafletConfig(layer)
  if (config.type === 'wms') return L.tileLayer.wms(config.url, { ...config.params, ...config.options })
  return L.tileLayer(config.url, config.options)
}
