import React, { useMemo } from 'react'
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
  const { wmsLayers, format, wmsVersion } = layer
  // react-leaflet calls setParams (and redraws every tile) when the params object changes, so keep its identity while
  // the WMS fields are the same, whatever else changes in the layers list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const wmsParams = useMemo(() => (config.type === 'wms' ? config.params : undefined), [wmsLayers, format, wmsVersion])
  if (config.type === 'wms' && wmsParams) {
    return <WMSTileLayer url={config.url} params={wmsParams} {...config.options} />
  }
  return <TileLayer url={config.url} {...config.options} />
}
