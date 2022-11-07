import './MapOptionsEditor.scss'

import React, { useCallback, useState } from 'react'

import * as Survey from '@core/survey/survey'

import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { ButtonIconGear } from '../buttons'
import { Checkbox } from '../form'
import { useMapContext } from './MapContext'
import { MapOptions } from './mapOptions'

export const MapOptionsEditor = () => {
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()

  const sampleBasedImageInterpretation = Survey.isSampleBasedImageInterpretationEnabled(surveyInfo)

  const { contextObject, onOptionUpdate } = useMapContext()
  const { options } = contextObject

  const [popupOpen, setPopupOpen] = useState(false)

  const onIconMouseOver = useCallback(() => {
    setPopupOpen(true)
  }, [])

  const onPopupMouseLeave = useCallback(() => {
    setPopupOpen(false)
  }, [])

  return (
    <div className="map-options leaflet-bottom leaflet-right">
      <div className="leaflet-control leaflet-bar">
        {!popupOpen && <ButtonIconGear onMouseOver={onIconMouseOver} />}
        {popupOpen && (
          <div className="popup" onMouseLeave={onPopupMouseLeave}>
            {Object.entries(options)
              .filter(
                ([key]) => !MapOptions.isOnlyForSampleBasedImageInterpretation(key) || sampleBasedImageInterpretation
              )
              .map(([key, value]) => (
                <Checkbox
                  key={key}
                  checked={value}
                  label={i18n.t(`mapView.options.${key}`)}
                  onChange={(valueUpdated) => onOptionUpdate({ option: key, value: valueUpdated })}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
