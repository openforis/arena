import React from 'react'
import { Popup } from 'react-leaflet'

import Markdown from '@webapp/components/markdown'

export const MapMarkerPopup = (props) => {
  const { point, title } = props

  const description = point
    ? `**${title}**
* x: ${point.x}
* y: ${point.y}
* SRS: ${point.srs}`
    : null

  return (
    <Popup>
      <Markdown source={description} />
    </Popup>
  )
}
