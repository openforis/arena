import { useCallback, useEffect, useMemo, useState } from 'react'

import { PointFactory, Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'

export const useMap = (props) => {
  const { centerPoint, markerPoint, onMarkerPointChange } = props

  const survey = useSurvey()
  const srsIndex = Survey.getSRSIndex(survey)

  const [state, setState] = useState({
    centerPositionLatLon: null,
    markerPointUpdated: null,
  })

  const { centerPositionLatLon, markerPointUpdated } = state

  const fromPointToLatLon = (point) => {
    if (Points.isValid(point, srsIndex)) {
      const pointLatLong = Points.toLatLong(point)
      const { x, y } = pointLatLong
      return [y, x]
    }
    return null
  }

  // on markerPoint update or after SRSs has been initialized, transform point to lat long
  useEffect(() => {
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
  }, [centerPoint, markerPoint])

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
