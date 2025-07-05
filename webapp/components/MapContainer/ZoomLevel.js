import './ZoomLevel.scss'

import React, { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'

export const ZoomLevel = () => {
  const map = useMap()
  const [zoomLevel, setZoomLevel] = useState()

  useEffect(() => {
    setZoomLevel(map.getZoom())
  }, [])

  map.on('zoomend', () => {
    setZoomLevel(map.getZoom())
  })

  return <span className="zoom-level">{zoomLevel}</span>
}
