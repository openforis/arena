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
    map.flyTo(nextPoint.latLng)
    map.once('zoomend', () => openPopupOfUuid(nextPoint.uuid))
  }

  const onClickPrevious = () => {
    const previousPoint = getPreviousPoint(itemUuid)
    map.flyTo(previousPoint.latLng)
    map.once('zoomend', () => openPopupOfUuid(previousPoint.uuid))
  }

  const earthMapLink = () => {
    const geojson = L.circle([point.y, point.x]).toGeoJSON()
    const url = "https://collectearth.users.earthengine.app/view/plot#geoJson=" + JSON.stringify(geojson.geometry)
    return url
    
  }

  return (
    <Popup>
      <Markdown source={content} />
      <button onClick={onClickPrevious}>{i18n.t('common.previous')}</button>
      <button onClick={onClickNext}>{i18n.t('common.next')} </button>
      <a href={earthMapLink()} target="_blank" rel="noreferrer">
        <button>Open in Earth Map</button>
      </a>
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
