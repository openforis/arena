import React from 'react'
import { Popup } from 'react-leaflet'

import { Points } from '@openforis/arena-core'

import Markdown from '@webapp/components/markdown'

import { useI18n } from '@webapp/store/system'

export const SamplingPointDataItemPopup = (props) => {
  const { location, codes } = props

  const i18n = useI18n()

  const point = Points.parse(location)

  const content = `**${i18n.t('mapView.samplingPointItemPopup.title')}**
${codes
  .map((code, index) => `* **${i18n.t('mapView.samplingPointItemPopup.levelCode', { level: index + 1 })}**: ${code}`)
  .join('\n')}
* **${i18n.t('mapView.samplingPointItemPopup.location')}**:
  * **x**: ${point.x}
  * **y**: ${point.y}
  * **SRS**: ${point.srs}
`

  return (
    <Popup>
      <Markdown source={content} />
    </Popup>
  )
}
