import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { PointFactory, Points, SRSs } from '@openforis/arena-core'

export const useMap = (props) => {
  const { centerPoint, markerPoint, markerTitle, onMarkerPositionChange } = props

  const [state, setState] = useState({
    srsInitialized: false,
    centerPositionLatLon: null,
    markerPositionLatLon: null,
    markerPositionUpdated: null,
  })
  const markerRef = useRef(null)

  const { srsInitialized, centerPositionLatLon, markerPositionLatLon, markerPositionUpdated } = state

  const fromPointToLatLon = (point) => {
    if (srsInitialized && Points.isValid(point)) {
      const pointLatLong = Points.toLatLong(point)
      const { x, y } = pointLatLong
      return [y, x]
    }
    return null
  }

  // initialize SRSs at component mount, before using Points functions
  useEffect(() => {
    ;(async () => {
      await SRSs.init()
      setState((statePrev) => ({ ...statePrev, srsInitialized: true }))
    })()
  }, [])

  // on markerPoint update or after SRSs has been initialized, transform point to lat long
  useEffect(() => {
    if (srsInitialized) {
      const actualCenterPoint = markerPoint || centerPoint || PointFactory.createInstance({ x: 0, y: 0, srs: '4326' })
      setState((statePrev) => ({
        ...statePrev,
        centerPositionLatLon: actualCenterPoint ? fromPointToLatLon(actualCenterPoint) : null,
        markerPositionLatLon: markerPoint ? fromPointToLatLon(markerPoint) : null,
      }))
    }
  }, [srsInitialized, centerPoint, markerPoint])

  const markerDescription = markerPoint
    ? `**${markerTitle}**
* x: ${markerPoint.x}
* y: ${markerPoint.y}
* SRS: ${markerPoint.srs}`
    : null

  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          const { lat, lng } = marker.getLatLng()
          const markerPositionUpdated = PointFactory.createInstance({ x: lng, y: lat, srs: '4326' })
          setState((statePrev) => ({ ...statePrev, markerPositionUpdated }))
        }
      },
    }),
    []
  )

  const onSaveClick = useCallback(() => {
    onMarkerPositionChange(markerPositionUpdated)
  }, [markerPositionUpdated])

  return {
    centerPositionLatLon,
    markerEventHandlers,
    markerDescription,
    markerPositionLatLon,
    markerRef,
    markerPositionUpdated,
    onSaveClick,
  }
}
