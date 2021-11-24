import React from 'react'
import { LayersControl } from 'react-leaflet'

import { OpenStreetMapLayer, ESRILayer } from './BaseLayers'

export const MapLayersControl = () => (
  <LayersControl position="topright">
    <LayersControl.BaseLayer checked name="ESRI">
      <ESRILayer />
    </LayersControl.BaseLayer>
    <LayersControl.BaseLayer name="OpenStreetMap">
      <OpenStreetMapLayer />
    </LayersControl.BaseLayer>
  </LayersControl>
)
