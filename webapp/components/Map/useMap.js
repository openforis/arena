import { useCallback, useEffect, useMemo, useState } from 'react'

import { PointFactory, Points } from '@openforis/arena-core'

import { useSurveySrsIndex } from '@webapp/store/survey'

export const useMap = (props) => {
  const { centerPoint, markerPoint, onMarkerPointChange } = props

  const srsIndex = useSurveySrsIndex()

  const [state, setState] = useState({
    centerPositionLatLon: null,
    markerPointUpdated: null,
  })

  const { centerPositionLatLon, markerPointUpdated } = state

  const fromPointToLatLon = useCallback(
    (point) => {
      if (Points.isValid(point, srsIndex)) {
        const pointLatLong = Points.toLatLong(point, srsIndex)
        const { x, y } = pointLatLong
        return [y, x]
      }
      return null
    },
    [srsIndex]
  )

  // on markerPoint update or after SRSs has been initialized, transform point to lat long
  useEffect(() => {
    const actualCenterPoint =
      markerPoint && Points.isValid(markerPoint, srsIndex)
        ? markerPoint
        : centerPoint && Points.isValid(centerPoint, srsIndex)
        ? centerPoint
        : PointFactory.createInstance({ x: 0, y: 0 })

    setState((statePrev) => ({
      ...statePrev,
      centerPositionLatLon: actualCenterPoint ? fromPointToLatLon(actualCenterPoint) : null,
    }))
  }, [centerPoint, fromPointToLatLon, markerPoint, srsIndex])

  const mapEventHandlers = useMemo(
    () => ({
      dblclick(event) {
        const [latitude, longitute] = event.latlng
        setState((statePrev) => ({
          ...statePrev,
          markerPositionLatLon: PointFactory.createInstance({ x: longitute, y: latitude }),
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
  }, [markerPointUpdated, onMarkerPointChange])

  return {
    centerPositionLatLon,
    mapEventHandlers,
    markerPointUpdated,
    onMarkerPointUpdated,
    onSaveClick,
  }
}
