import React, { useCallback, useRef, useState } from 'react'
import { Popup, useMap } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import Markdown from '@webapp/components/markdown'

import { useI18n } from '@webapp/store/system'
import { ButtonAdd, ButtonIconEdit } from '@webapp/components'
import { ButtonNext } from '@webapp/components/buttons/ButtonNext'
import { ButtonPrevious } from '@webapp/components/buttons/ButtonPrevious'
import { useAuthCanCreateRecord } from '@webapp/store/user'
import { useSurvey } from '@webapp/store/survey'
import { useElevation } from '../common/useElevation'

export const SamplingPointDataItemPopup = (props) => {
  const {
    pointFeature,
    getNextPoint,
    getPreviousPoint,
    openPopupOfPoint,
    onRecordEditClick,
    createRecordFromSamplingPointDataItem,
  } = props

  const { properties: pointProperties } = pointFeature
  const { itemUuid, itemCodes, itemPoint: point, recordUuid } = pointProperties

  const popupRef = useRef(null)
  const i18n = useI18n()
  const map = useMap()

  const survey = useSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)

  const canCreateRecord =
    useAuthCanCreateRecord() &&
    Survey.isPublished(surveyInfo) &&
    Survey.canRecordBeIdentifiedBySamplingPointDataItem(survey)

  const [open, setOpen] = useState(false)

  const elevation = useElevation(point, open)

  const content = `**${i18n.t('mapView.samplingPointItemPopup.title')}**
${itemCodes
  .map((code, index) => `* **${i18n.t('mapView.samplingPointItemPopup.levelCode', { level: index + 1 })}**: ${code}`)
  .join('\n')}
* **${i18n.t('mapView.samplingPointItemPopup.location')}**:
  * **x**: ${point.x}
  * **y**: ${point.y}
  * **SRS**: ${point.srs}
  * **elevation (m)**: ${elevation}`

  const flyToPoint = (point) => {
    popupRef.current?.close()
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

  const onRecordCreate = useCallback(
    ({ recordUuid }) => {
      // update current point
      pointProperties.recordUuid = recordUuid
    },
    [pointProperties]
  )

  return (
    <Popup
      className="sampling-point-data__item-popup-content"
      eventHandlers={{
        add: () => setOpen(true),
        remove: () => setOpen(false),
      }}
      ref={popupRef}
    >
      <Markdown source={content} />
      <div className="button-bar">
        <ButtonPrevious className="prev-btn" onClick={onClickPrevious} showLabel={false} />
        {recordUuid && (
          <ButtonIconEdit label="mapView.editRecord" showLabel onClick={() => onRecordEditClick({ recordUuid })} />
        )}
        {canCreateRecord && !recordUuid && (
          <ButtonAdd
            label="mapView.createRecord"
            showLabel
            onClick={() => createRecordFromSamplingPointDataItem({ itemUuid, callback: onRecordCreate })}
          />
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
  createRecordFromSamplingPointDataItem: PropTypes.func,
}
