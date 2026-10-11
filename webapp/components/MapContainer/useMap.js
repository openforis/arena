import { useCallback, useEffect, useMemo, useState } from 'react'

import { PointFactory, Points } from '@openforis/arena-core'

import { GeoJsonUtils } from '@core/geo/geoJsonUtils'

import { useSurveySrsIndex } from '@webapp/store/survey'

const calculateActualCenterPoint = ({ centerPoint, geoJson, markerPoint, srsIndex }) => {
  if (markerPoint && Points.isValid(markerPoint, srsIndex)) {
    return markerPoint
  }
  if (geoJson) {
    const centroidPoint = GeoJsonUtils.centroidPoint(geoJson)
    if (centroidPoint) {
      return centroidPoint
    }
  }
  if (centerPoint && Points.isValid(centerPoint, srsIndex)) {
    return centerPoint
  }
  return PointFactory.createInstance({ x: 0, y: 0 })
}

const pointToString = (point) =>
  point && Number.isFinite(point.x) && Number.isFinite(point.y) ? `${point.y.toFixed(5)}, ${point.x.toFixed(5)}` : ''

export const useMap = (props) => {
  const { centerPoint, geoJson, markerPoint, onMarkerPointChange } = props

  const srsIndex = useSurveySrsIndex()

  const [markerPointUpdated, setMarkerPointUpdated] = useState(null)

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
  const centerPositionLatLon = useMemo(() => {
    const actualCenterPoint = calculateActualCenterPoint({ centerPoint, geoJson, markerPoint, srsIndex })
    return actualCenterPoint ? fromPointToLatLon(actualCenterPoint) : null
  }, [centerPoint, fromPointToLatLon, geoJson, markerPoint, srsIndex])

  const onSaveClick = useCallback(() => {
    onMarkerPointChange(markerPointUpdated)
  }, [markerPointUpdated, onMarkerPointChange])

  const markerPointUpdatedToString = pointToString(markerPointUpdated)

  return {
    centerPositionLatLon,
    markerPointUpdated,
    markerPointUpdatedToString,
    onMarkerPointUpdated: setMarkerPointUpdated,
    onSaveClick,
  }
}
