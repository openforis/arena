import { useCallback, useEffect, useMemo, useState } from 'react'

import { PointFactory, Points } from '@openforis/arena-core'

import { useSRSs } from '@webapp/components/hooks'

export const useMap = (props) => {
  const { centerPoint, markerPoint, onMarkerPointChange } = props

  const { srssInitialized } = useSRSs()

  const [state, setState] = useState({
    centerPositionLatLon: null,
    markerPointUpdated: null,
  })

  const { centerPositionLatLon, markerPointUpdated } = state

  const fromPointToLatLon = (point) => {
    if (srssInitialized && Points.isValid(point)) {
      const pointLatLong = Points.toLatLong(point)
      const { x, y } = pointLatLong
      return [y, x]
    }
    return null
  }

  // on markerPoint update or after SRSs has been initialized, transform point to lat long
  useEffect(() => {
    if (srssInitialized) {
      const actualCenterPoint =
        markerPoint && Points.isValid(markerPoint)
          ? markerPoint
          : centerPoint && Points.isValid(centerPoint)
          ? centerPoint
          : PointFactory.createInstance({ x: 0, y: 0, srs: '4326' })

      setState((statePrev) => ({
        ...statePrev,
        centerPositionLatLon: actualCenterPoint ? fromPointToLatLon(actualCenterPoint) : null,
      }))
    }
  }, [srssInitialized, centerPoint, markerPoint])

  const mapEventHandlers = useMemo(
    () => ({
      dblclick(event) {
        const [latitude, longitute] = event.latlng
        setState((statePrev) => ({
          ...statePrev,
          markerPositionLatLon: PointFactory.createInstance({ x: longitute, y: latitude, srs: '4326' }),
        }))
      },
    }),
    []
  )

  const onMarkerPointUpdated = useCallback((markerPointUpdated) => {
    setState((statePrev) => ({ ...statePrev, markerPointUpdated }))
  }, [])

  const onSaveClick = useCallback(() => {
    onMarkerPointChange(markerPointUpdated)
  }, [markerPointUpdated])

  return {
    centerPositionLatLon,
    mapEventHandlers,
    markerPointUpdated,
    onMarkerPointUpdated,
    onSaveClick,
  }
}
