import './MapOptions.scss'

import React, { useCallback, useState } from 'react'

import { useI18n } from '@webapp/store/system'
import { ButtonIconGear } from '../buttons'
import { Checkbox } from '../form'
import { FormItem } from '../form/Input'
import { useMapContext } from './MapContext'

export const MapOptions = () => {
  const i18n = useI18n()

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
            <FormItem label={i18n.t('mapView.options.showMarkersLabels')}>
              <Checkbox
                checked={options.showMarkersLabels}
                onChange={(value) => onOptionUpdate({ option: 'showMarkersLabels', value })}
              />
            </FormItem>
            <FormItem label={i18n.t('mapView.options.showSamplingPolygon')}>
              <Checkbox
                checked={options.showSamplingPolygon}
                onChange={(value) => onOptionUpdate({ option: 'showSamplingPolygon', value })}
              />
            </FormItem>
            <FormItem label={i18n.t('mapView.options.showControlPoints')}>
              <Checkbox
                checked={options.showControlPoints}
                onChange={(value) => onOptionUpdate({ option: 'showControlPoints', value })}
              />
            </FormItem>
            <FormItem label={i18n.t('mapView.options.showPlotReferencePoint')}>
              <Checkbox
                checked={options.showPlotReferencePoint}
                onChange={(value) => onOptionUpdate({ option: 'showPlotReferencePoint', value })}
              />
            </FormItem>
          </div>
        )}
      </div>
    </div>
  )
}
