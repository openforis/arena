import './ZoomLevel.scss'

import React, { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'

export const ZoomLevel = () => {
  const map = useMap()
  const [zoomLevel, setZoomLevel] = useState(() => map.getZoom())

  useEffect(() => {
    const onZoomEnd = () => setZoomLevel(map.getZoom())
    map.on('zoomend', onZoomEnd)
    return () => {
      map.off('zoomend', onZoomEnd)
    }
  }, [map])

  return <span className="zoom-level">{zoomLevel}</span>
}
