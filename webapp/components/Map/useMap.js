import { useEffect, useState } from 'react'

import { Points, SRSs } from '@openforis/arena-core'

export const useMap = (props) => {
  const { markerPoint, markerTitle } = props

  const [srsInitialized, setSrsInitialized] = useState(false)
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
      setMarkerPositionLatLon(markerPoint ? fromPointToLatLon(markerPoint) : null)
    }
  }, [srsInitialized, markerPoint])

  const markerDescription = markerPoint
    ? `**${markerTitle}**
* x: ${markerPoint.x}
* y: ${markerPoint.y}
* SRS: ${markerPoint.srs}`
    : null

  return {
    markerPositionLatLon,
    markerDescription,
  }
}
