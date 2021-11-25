import './Map.scss'

import React from 'react'
import { MapContainer, Marker, Popup } from 'react-leaflet'
import PropTypes from 'prop-types'

import Markdown from '@webapp/components/markdown'

import { MapLayersControl } from './MapLayersControl'
import { useMap } from './useMap'

// start of workaround to show leaflet marker icon
import leaflet from 'leaflet'
leaflet.Marker.prototype.options.icon = leaflet.icon({
  iconSize: [25, 41],
  iconAnchor: [10, 41],
  popupAnchor: [2, -40],
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
})
// end of workaround

export const Map = (props) => {
  const { layers } = props
  const { centerPositionLatLon, markerPositionLatLon, markerDescription } = useMap(props)

  if (!centerPositionLatLon) {
    return null
  }

  return (
    <MapContainer center={centerPositionLatLon} zoom={4}>
      <MapLayersControl layers={layers} />
      {markerPositionLatLon && (
        <Marker position={markerPositionLatLon}>
          <Popup>
            <Markdown source={markerDescription} />
          </Popup>
        </Marker>
      )}m
    </MapContainer>
  )
}

Map.propTypes = {
  centerPoint: PropTypes.object,
  layers: PropTypes.element,
  markerPoint: PropTypes.object,
  markerTitle: PropTypes.string,
}

Map.defaultProps = {
  centerPoint: null,
  layers: null,
  markerPoint: null,
  markerTitle: null,
}
