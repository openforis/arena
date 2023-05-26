import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMapEvents } from 'react-leaflet'

import { PointFactory, Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import { useSurvey } from '@webapp/store/survey'

export const useMapMarker = (props) => {
  const { editable, onPointUpdated: onPointUpdatedProp, point } = props

  const survey = useSurvey()
  const srsIndex = Survey.getSRSIndex(survey)

  const markerRef = useRef(null)

  const [state, setState] = useState({
    pointLatLon: null, // array with latitude and longitude values
  })

  const { pointLatLon } = state

  const fromPointToLatLon = (point) => {
    if (Points.isValid(point, srsIndex)) {
      const pointLatLong = Points.toLatLong(point, srsIndex)
      const { x, y } = pointLatLong
      return [y, x]
    }
    return null
  }
  // on point update or after SRSs has been initialized, transform point to lat long
  useEffect(() => {
    if (point) {
      setState((statePrev) => ({
        ...statePrev,
        pointLatLon: fromPointToLatLon(point),
      }))
    }
  }, [point])

  const onPointUpdated = useCallback(
    ({ lat, lng }) => {
      setState((statePrev) => ({
        ...statePrev,
        pointLatLon: [lat, lng],
      }))

      let pointUpdated = PointFactory.createInstance({ x: lng, y: lat, srs: '4326' })

      // transform updated location into a location with the same SRS as the marker position parameter
      if (point?.srs && point.srs !== pointUpdated.srs) {
        pointUpdated = Points.transform(pointUpdated, point.srs, srsIndex)
      }
      onPointUpdatedProp(pointUpdated)
    },
    [onPointUpdatedProp, point.srs, srsIndex]
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

  if (editable) {
    useMapEvents({
      dblclick(event) {
        const { lat, lng } = event.latlng
        onPointUpdated({ lat, lng })
      },
    })
  }

  return { markerEventHandlers, markerRef, pointLatLon }
}
