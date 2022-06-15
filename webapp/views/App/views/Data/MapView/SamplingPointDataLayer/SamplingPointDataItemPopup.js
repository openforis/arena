import React from 'react'
import { Popup } from 'react-leaflet'
import PropTypes from 'prop-types'

import { Points } from '@openforis/arena-core'

import Markdown from '@webapp/components/markdown'

import { useI18n } from '@webapp/store/system'
import { useMap } from 'react-leaflet'

export const SamplingPointDataItemPopup = (props) => {
  const { location, codes, itemUuid, getNextPoint, getPreviousPoint, openPopupOfUuid } = props

  const i18n = useI18n()
  const map = useMap()

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
  const onClickNext = () => {
    const nextPoint = getNextPoint(itemUuid)
    map.flyTo(nextPoint.latLng, 15)
    map.once('zoomend', () => openPopupOfUuid(nextPoint.uuid))
  }

  const onClickPrevious = () => {
    const previousPoint = getPreviousPoint(itemUuid)
    map.flyTo(previousPoint.latLng)
    map.once('zoomend', () => openPopupOfUuid(previousPoint.uuid))
  }

  return (
    <Popup>
      <Markdown source={content} />
      <button onClick={onClickPrevious}>Previous</button>
      <button onClick={onClickNext}>Next </button>
    </Popup>
  )
}

SamplingPointDataItemPopup.propTypes = {
  location: PropTypes.string,
  codes: PropTypes.any,
  itemUuid: PropTypes.string,
  getNextPoint: PropTypes.func,
  getPreviousPoint: PropTypes.func,
  openPopupOfUuid: PropTypes.func,
}
