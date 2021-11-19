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
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
})
// end of workaround

export const Map = (props) => {
  const { markerPositionLatLon, markerDescription } = useMap(props)

  if (!markerPositionLatLon) {
    return null
  }

  return (
    <MapContainer center={markerPositionLatLon} zoom={4}>
      <MapLayersControl />
      <Marker position={markerPositionLatLon}>
        <Popup>
          <Markdown source={markerDescription} />
        </Popup>
      </Marker>
    </MapContainer>
  )
}

Map.propTypes = {
  markerPoint: PropTypes.object,
  markerTitle: PropTypes.string,
}

Map.defaultProps = {
  markerPoint: null,
  markerTitle: null,
}
