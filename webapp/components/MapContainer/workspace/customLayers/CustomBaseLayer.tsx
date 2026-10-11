import React from 'react'
import { TileLayer, WMSTileLayer } from 'react-leaflet'

import type { MapCustomLayer } from '@core/map/customLayers/mapCustomLayer'
import { getCustomLayerLeafletConfig } from '@webapp/components/MapContainer/workspace/customLayers/customLayerLeaflet'

/**
 * Renders a custom base map inside a LayersControl.BaseLayer.
 * @param {object} props - Props.
 * @param {MapCustomLayer} props.layer - The layer (role baseMap).
 * @returns {React.ReactElement} The react-leaflet layer.
 */
export const CustomBaseLayer = ({ layer }: { layer: MapCustomLayer }): React.ReactElement => {
  const config = getCustomLayerLeafletConfig(layer)
  if (config.type === 'wms') return <WMSTileLayer url={config.url} params={config.params} {...config.options} />
  return <TileLayer url={config.url} {...config.options} />
}
