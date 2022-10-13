import './ShowZoomLevel.scss'

import React, { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'

export const ShowZoomLevel = () => {
  const map = useMap()
  const [zoomLevel, setZoomLevel] = useState()

  useEffect(() => {
    setZoomLevel(map.getZoom())
  }, [])

  map.on('zoomend', () => {
    setZoomLevel(map.getZoom())
  })

  return <div className="leaflet-bottom show-zoom-level">{zoomLevel}</div>
}
