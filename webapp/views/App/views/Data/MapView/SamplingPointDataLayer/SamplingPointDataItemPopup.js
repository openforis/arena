import React, { useCallback, useRef, useState } from 'react'
import { Popup } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { ButtonAdd, ButtonIconEdit } from '@webapp/components'
import { ButtonNext, ButtonPrevious } from '@webapp/components/buttons'
import Markdown from '@webapp/components/markdown'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useAuthCanCreateRecord } from '@webapp/store/user'

import { useElevation } from '../common/useElevation'
import { LocationSummaryGenerator } from '../common/locationSummaryGenerator'

const generateContent = ({ i18n, itemCodes, locationPoint, elevation }) => {
  const levelCodesList = itemCodes
    .map((code, index) => `* **${i18n.t('mapView.samplingPointItemPopup.levelCode', { level: index + 1 })}**: ${code}`)
    .join('\n')
  const locationSummary = LocationSummaryGenerator.generateSummary({ i18n, point: locationPoint, elevation })

  return `**${i18n.t('mapView.samplingPointItemPopup.title')}**
${levelCodesList}
${locationSummary}`
}

export const SamplingPointDataItemPopup = (props) => {
  const { createRecordFromSamplingPointDataItem, flyToNextPoint, flyToPreviousPoint, onRecordEditClick, pointFeature } =
    props

  const { properties: pointProperties } = pointFeature
  const { itemUuid, itemCodes, itemLatLongPoint: point, locationPoint, recordUuid } = pointProperties

  const popupRef = useRef(null)
  const i18n = useI18n()

  const userCanCreateRecords = useAuthCanCreateRecord()
  const survey = useSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)

  const canCreateRecord =
    userCanCreateRecords &&
    itemCodes.length === 1 && // first level
    Survey.isPublished(surveyInfo) &&
    Survey.canRecordBeIdentifiedBySamplingPointDataItem(survey)

  const [open, setOpen] = useState(false)

  const elevation = useElevation({ survey, point, active: open })

  const content = generateContent({ i18n, itemCodes, locationPoint, elevation })

  const onClickNext = () => {
    flyToNextPoint(pointFeature)
    popupRef.current?.close()
  }

  const onClickPrevious = () => {
    flyToPreviousPoint(pointFeature)
    popupRef.current?.close()
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
            className="new-record-btn"
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
  createRecordFromSamplingPointDataItem: PropTypes.func.isRequired,
  flyToNextPoint: PropTypes.func.isRequired,
  flyToPreviousPoint: PropTypes.func.isRequired,
  pointFeature: PropTypes.any.isRequired,
  onRecordEditClick: PropTypes.func.isRequired,
}
