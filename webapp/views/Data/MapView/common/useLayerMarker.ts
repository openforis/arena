import { useEffect, useRef } from 'react'

import { useMapContextOptions } from '@webapp/components/MapContainer/MapContext'

import type { MapPointMarker, SetMarkerByKey } from './mapPointTypes'

export const useLayerMarker = ({
  key,
  popupOpen,
  setMarkerByKey,
}: {
  key: string
  popupOpen?: boolean
  setMarkerByKey?: SetMarkerByKey
}) => {
  const markerRef = useRef<MapPointMarker | null>(null)

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
