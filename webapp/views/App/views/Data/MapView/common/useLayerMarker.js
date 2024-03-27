import { useEffect, useRef } from 'react'

import { useMapContextOptions } from '@webapp/components/Map/MapContext'

export const useLayerMarker = ({ key, popupOpen, setMarkerByKey }) => {
  const markerRef = useRef(null)

  const options = useMapContextOptions()
  const { showMarkersLabels, showLocationMarkers } = options

  useEffect(() => {
    const marker = markerRef.current
    marker.setStyle({
      fill: showLocationMarkers,
      stroke: showLocationMarkers,
    })
    if (showMarkersLabels && !marker.isTooltipOpen()) {
      marker.toggleTooltip()
    }
    if (popupOpen) {
      marker.openPopup()
    }
    return () => {
      setMarkerByKey?.({ key, marker: null })
    }
  }, [markerRef, key, popupOpen, setMarkerByKey, showLocationMarkers, showMarkersLabels])

  return { markerRef, showLocationMarkers, showMarkersLabels }
}
