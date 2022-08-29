import './ShowZoomLevel.scss'

import React, { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'

export const ShowZoomLevel = () => {
  const map = useMap()
  const user = useUser()
  const [zoomLevel, setZoomLevel] = useState()

  useEffect(() => {
    setZoomLevel(map.getZoom())
  }, [])

  map.on('zoomend', () => {
    setZoomLevel(map.getZoom())
  })

  if (!User.isSystemAdmin(user)) {
    return null
  }
  return <div className="leaflet-bottom show-zoom-level">{zoomLevel}</div>
}
