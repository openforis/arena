import React from 'react'
import { Popup } from 'react-leaflet'
import PropTypes from 'prop-types'

import { Points } from '@openforis/arena-core'

import Markdown from '@webapp/components/markdown'

import { useI18n } from '@webapp/store/system'
import { useMap } from 'react-leaflet'
import { ButtonIconEdit } from '@webapp/components'
import { ButtonNext } from '@webapp/components/buttons/ButtonNext'
import { ButtonPrevious } from '@webapp/components/buttons/ButtonPrevious'

export const SamplingPointDataItemPopup = (props) => {
  const { pointFeature, getNextPoint, getPreviousPoint, openPopupOfPoint, onRecordEditClick } = props

  const { itemUuid, itemCodes, location, recordUuid } = pointFeature.properties

  const i18n = useI18n()
  const map = useMap()

  const point = Points.parse(location)

  const content = `**${i18n.t('mapView.samplingPointItemPopup.title')}**
${itemCodes
  .map((code, index) => `* **${i18n.t('mapView.samplingPointItemPopup.levelCode', { level: index + 1 })}**: ${code}`)
  .join('\n')}
* **${i18n.t('mapView.samplingPointItemPopup.location')}**:
  * **x**: ${point.x}
  * **y**: ${point.y}
  * **SRS**: ${point.srs}
`
  const flyToPoint = (point) => {
    map.flyTo(point.latLng)
    map.once('zoomend', () => openPopupOfPoint(point))
  }

  const onClickNext = () => {
    const nextPoint = getNextPoint(itemUuid)
    flyToPoint(nextPoint)
  }

  const onClickPrevious = () => {
    const previousPoint = getPreviousPoint(itemUuid)
    flyToPoint(previousPoint)
  }

  const earthMapLink = () => {
    const geojson = L.circle([point.y, point.x]).toGeoJSON()
    const url = "https://collectearth.users.earthengine.app/view/plot#geoJson=" + JSON.stringify(geojson.geometry)
    return url
    
  }

  return (
    <Popup className="sampling-point-data__item-popup-content">
      <Markdown source={content} />
      <div className="button-bar">
        <ButtonPrevious className="prev-btn" onClick={onClickPrevious} showLabel={false} />
        {recordUuid && (
          <ButtonIconEdit label="mapView.editRecord" showLabel onClick={() => onRecordEditClick({ recordUuid })} />
        )}
        <ButtonNext className="next-btn" onClick={onClickNext} showLabel={false} />
      </div>
    </Popup>
  )
}

SamplingPointDataItemPopup.propTypes = {
  pointFeature: PropTypes.any,
  getNextPoint: PropTypes.func,
  getPreviousPoint: PropTypes.func,
  openPopupOfPoint: PropTypes.func,
  onRecordEditClick: PropTypes.func,
}
