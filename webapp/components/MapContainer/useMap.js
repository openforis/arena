import { useCallback, useEffect, useState } from 'react'

import { PointFactory, Points } from '@openforis/arena-core'

import { GeoJsonUtils } from '@core/geo/geoJsonUtils'

import { useSurveySrsIndex } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

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

  const i18n = useI18n()
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

  useEffect(() => {
    // set ruler button tooltip on mount
    setTimeout(() => {
      const rulerTooltip = i18n.t('mapView.rulerTooltip')
      const rulerButton = document.getElementsByClassName('leaflet-ruler')?.item(0)
      if (rulerButton) {
        rulerButton.setAttribute('title', rulerTooltip)
      }
    }, 500)
  }, [i18n])

  // on markerPoint update or after SRSs has been initialized, transform point to lat long
  useEffect(() => {
    const actualCenterPoint = calculateActualCenterPoint({ centerPoint, geoJson, markerPoint, srsIndex })

    setState((statePrev) => ({
      ...statePrev,
      centerPositionLatLon: actualCenterPoint ? fromPointToLatLon(actualCenterPoint) : null,
    }))
  }, [centerPoint, fromPointToLatLon, geoJson, markerPoint, srsIndex])

  const onMarkerPointUpdated = useCallback((markerPointUpdated) => {
    setState((statePrev) => ({ ...statePrev, markerPointUpdated }))
  }, [])

  const onSaveClick = useCallback(() => {
    onMarkerPointChange(markerPointUpdated)
  }, [markerPointUpdated, onMarkerPointChange])

  const markerPointUpdatedToString = pointToString(markerPointUpdated)

  return {
    centerPositionLatLon,
    markerPointUpdated,
    markerPointUpdatedToString,
    onMarkerPointUpdated,
    onSaveClick,
  }
}
