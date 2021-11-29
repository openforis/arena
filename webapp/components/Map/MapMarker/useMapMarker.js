import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { PointFactory, Points } from '@openforis/arena-core'

import { useSRSs } from '@webapp/components/hooks'
import { useMapEvents } from 'react-leaflet'

export const useMapMarker = (props) => {
  const { onPointUpdated: onPointUpdatedProp, point } = props

  const { srssInitialized } = useSRSs()

  const markerRef = useRef(null)

  const [state, setState] = useState({
    pointLatLon: null, // array with latitude and longitude values
  })

  const { pointLatLon } = state

  const fromPointToLatLon = (point) => {
    if (srssInitialized && Points.isValid(point)) {
      const pointLatLong = Points.toLatLong(point)
      const { x, y } = pointLatLong
      return [y, x]
    }
    return null
  }
  // on point update or after SRSs has been initialized, transform point to lat long
  useEffect(() => {
    if (srssInitialized) {
      setState((statePrev) => ({
        ...statePrev,
        pointLatLon: point ? fromPointToLatLon(point) : null,
      }))
    }
  }, [srssInitialized, point])

  const onPointUpdated = useCallback(
    ({ lat, lng }) => {
      setState((statePrev) => ({
        ...statePrev,
        pointLatLon: [lat, lng],
      }))

      let pointUpdated = PointFactory.createInstance({ x: lng, y: lat, srs: '4326' })

      // transform updated location into a location with the same SRS as the marker position parameter
      if (point && point.srs !== pointUpdated.srs) {
        pointUpdated = Points.transform(pointUpdated, point.srs)
      }
      onPointUpdatedProp(pointUpdated)
    },
    [point]
  )

  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          const { lat, lng } = marker.getLatLng()
          onPointUpdated({ lat, lng })
        }
      },
    }),
    []
  )

  useMapEvents({
    dblclick(event) {
      const { lat, lng } = event.latlng
      onPointUpdated({ lat, lng })
    },
  })

  return { markerEventHandlers, markerRef, pointLatLon }
}
