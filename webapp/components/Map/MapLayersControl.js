import React from 'react'
import { LayersControl, TileLayer } from 'react-leaflet'
import PropTypes from 'prop-types'

import { baseLayers } from './baseLayers'

export const MapLayersControl = (props) => {
  const { layers } = props
  return (
    <LayersControl position="topright">
      {baseLayers.map(({ key, name, attribution, url }, index) => (
        <LayersControl.BaseLayer key={key} name={name} checked={index === 0}>
          <TileLayer attribution={attribution} url={url} />
        </LayersControl.BaseLayer>
      ))}
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
