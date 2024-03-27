import { useCallback, useEffect, useState } from 'react'

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

  const onMarkerPointUpdated = useCallback((markerPointUpdated) => {
    setState((statePrev) => ({ ...statePrev, markerPointUpdated }))
  }, [])

  const onSaveClick = useCallback(() => {
    onMarkerPointChange(markerPointUpdated)
  }, [markerPointUpdated, onMarkerPointChange])

  const markerPointUpdatedToString = markerPointUpdated
    ? `${markerPointUpdated.y.toFixed(5)}, ${markerPointUpdated.x.toFixed(5)}`
    : ''

  return {
    centerPositionLatLon,
    markerPointUpdated,
    markerPointUpdatedToString,
    onMarkerPointUpdated,
    onSaveClick,
  }
}
