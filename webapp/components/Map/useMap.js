import { useEffect, useState } from 'react'

import { PointFactory, Points, SRSs } from '@openforis/arena-core'

export const useMap = (props) => {
  const { centerPoint, markerPoint, markerTitle } = props

  const [srsInitialized, setSrsInitialized] = useState(false)
  const [centerPositionLatLon, setCenterPositionLatLon] = useState(null)
  const [markerPositionLatLon, setMarkerPositionLatLon] = useState(null)

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
      setSrsInitialized(true)
    })()
  }, [])

  // on markerPoint update or after SRSs has been initialized, transform point to lat long
  useEffect(() => {
    if (srsInitialized) {
      const actualCenterPoint = markerPoint || centerPoint || PointFactory.createInstance({ x: 0, y: 0, srs: '4326' })
      setCenterPositionLatLon(actualCenterPoint ? fromPointToLatLon(actualCenterPoint) : null)
      setMarkerPositionLatLon(markerPoint ? fromPointToLatLon(markerPoint) : null)
    }
  }, [srsInitialized, centerPoint, markerPoint])

  const markerDescription = markerPoint
    ? `**${markerTitle}**
* x: ${markerPoint.x}
* y: ${markerPoint.y}
* SRS: ${markerPoint.srs}`
    : null

  return {
    centerPositionLatLon,
    markerPositionLatLon,
    markerDescription,
  }
}
