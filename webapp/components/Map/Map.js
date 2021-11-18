import './Map.scss'

import React from 'react'
import { LayersControl, MapContainer, Marker, Popup } from 'react-leaflet'
import leaflet from 'leaflet'

import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = leaflet.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
})

leaflet.Marker.prototype.options.icon = DefaultIcon

import { OpenStreetMapLayer, ESRILayer } from './TileLayers'

const fromPointToLatLon = (point) => [point.y, point.x]

export const Map = (props) => {
  const { markerPosition, markerDescription } = props

  const markerPositionLatLon = markerPosition ? fromPointToLatLon(markerPosition) : null

  return (
    <MapContainer center={markerPositionLatLon} zoom={4}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="ESRI">
          <ESRILayer />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OpenStreetMap">
          <OpenStreetMapLayer />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay checked name="Location">
          <Marker position={markerPositionLatLon}>
            <Popup>{markerDescription}</Popup>
          </Marker>
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  )
}
