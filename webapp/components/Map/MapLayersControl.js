import React from 'react'
import { LayersControl } from 'react-leaflet'
import PropTypes from 'prop-types'

import { ESRILayer } from './BaseLayers'

export const MapLayersControl = (props) => {
  const { layers } = props
  return (
    <LayersControl position="topright">
      <LayersControl.BaseLayer checked name="ESRI">
        <ESRILayer />
      </LayersControl.BaseLayer>
      {/* <LayersControl.BaseLayer name="OpenStreetMap">
        <OpenStreetMapLayer />
      </LayersControl.BaseLayer> */}
      {layers}
    </LayersControl>
  )
}

MapLayersControl.propTypes = {
  layers: PropTypes.array,
}

MapLayersControl.defaultProps = {
  layers: [],
}
