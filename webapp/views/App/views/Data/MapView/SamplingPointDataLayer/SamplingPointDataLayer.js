import React from 'react'
import { CircleMarker, LayersControl, LayerGroup, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import PropTypes from 'prop-types'

import { useSamplingPointDataLayer } from './useSamplingPointDataLayer'
import { SamplingPointDataClusters } from './SamplingPointDataClusters'

export const SamplingPointDataLayer = (props) => {
  const { items, checked, overlayName } = useSamplingPointDataLayer(props)

  return (
    <LayersControl.Overlay checked={checked} name={overlayName}>
      <LayerGroup /> {/* empty layer group to allow showing the  layer */}
      <SamplingPointDataClusters items={items} />
      {/*
      <MarkerClusterGroup>
        {items.map((item) => (
          <CircleMarker key={item.uuid} center={item.location} pathOptions={{ fillColor: 'blue' }} radius={20}>
            <Popup>{item.codes}</Popup>
          </CircleMarker>
        ))}
      </MarkerClusterGroup>
        */}
    </LayersControl.Overlay>
  )
}

SamplingPointDataLayer.propTypes = {
  levelIndex: PropTypes.number,
}

SamplingPointDataLayer.defaultProps = {
  levelIndex: 0,
}
