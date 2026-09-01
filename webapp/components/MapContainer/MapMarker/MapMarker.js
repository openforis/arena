import { Marker } from 'react-leaflet'

import { useElevation } from '@webapp/views/App/views/Data/MapView/common/useElevation'

import { useMapMarker } from './useMapMarker'
import { MapMarkerPopup } from './MapMarkerPopup'

export const MapMarker = (props) => {
  const { editable, point, title } = props

  const { markerEventHandlers, markerRef, pointLatLon, popupOpen, pointUpdated } = useMapMarker(props)

  const actualPoint = pointUpdated ?? point
  const elevation = useElevation({ point: actualPoint, active: !!actualPoint && popupOpen })

  if (!pointLatLon) {
    // invalid location
    return null
  }

  return (
    <Marker draggable={editable} eventHandlers={markerEventHandlers} position={pointLatLon} ref={markerRef}>
      <MapMarkerPopup elevation={elevation} point={actualPoint} title={title} />
    </Marker>
  )
}
