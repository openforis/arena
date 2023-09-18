import React from 'react'
import { Marker } from 'react-leaflet'

import { MapMarkerPopup } from './MapMarkerPopup'
import { useMapMarker } from './useMapMarker'

export const MapMarker = (props) => {
  const { editable, point, title } = props

  const { markerEventHandlers, markerRef, pointLatLon, pointUpdated } = useMapMarker(props)

  if (!pointLatLon) {
    // invalid location
    return null
  }

  return (
    <Marker draggable={editable} eventHandlers={markerEventHandlers} position={pointLatLon} ref={markerRef}>
      <MapMarkerPopup point={pointUpdated ?? point} title={title} />
    </Marker>
  )
}
