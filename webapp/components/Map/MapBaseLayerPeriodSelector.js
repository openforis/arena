import './MapBaseLayerPeriodSelector.scss'

import React, { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import * as API from '@webapp/service/api'

import { Slider } from '../Slider'

import { baseLayerAttribution, baseLayerUrlByProviderFunction, planetAttribution } from './baseLayers'
import { useMapContext, useMapContextBaseLayer } from './MapContext'

const getPeriodValue = (period) => {
  const { year, month } = period
  return year * 12 + month
}

export const MapBaseLayerPeriodSelector = () => {
  const map = useMap()
  const contextBaseLayer = useMapContextBaseLayer()
  const { onBaseLayerUpdate } = useMapContext()
  const { periodSelectorAvailable, provider } = contextBaseLayer

  const i18n = useI18n()
  const user = useUser()
  const [state, setState] = useState({ ready: false, periods: [], periodByValue: {}, selectedPeriodValue: null })

  const apiKey = User.getMapApiKey({ provider })(user)

  const { ready, periods, periodByValue, selectedPeriodValue } = state

  useEffect(() => {
    if (!periodSelectorAvailable || !provider || !apiKey) return
    ;(async () => {
      const availablePeriods = await API.fetchAvailableMapPeriods({ provider, apiKey })
      setState({
        ready: true,
        periods: availablePeriods,
        periodByValue: availablePeriods.reduce((acc, period) => ({ ...acc, [getPeriodValue(period)]: period }), {}),
        selectedPeriodValue: getPeriodValue(availablePeriods[availablePeriods.length - 1]),
      })
    })()
  }, [periodSelectorAvailable, provider, apiKey])

  if (!periodSelectorAvailable || !provider || !ready) return null

  const onMapLayerPeriodChange = (event) => {
    const periodValue = event.target.value
    // replace url in current layer
    const layer = Object.values(map._layers).find(
      (layer) => layer._url && layer.options.attribution === baseLayerAttribution[provider]
    )
    if (layer) {
      const period = periodByValue[periodValue]
      const url = baseLayerUrlByProviderFunction[provider]({ period, apiKey })
      layer.setUrl(url)
      onBaseLayerUpdate({ ...contextBaseLayer, url })
      // update state
      setState((statePrev) => ({ ...statePrev, selectedPeriodValue: periodValue }))
    }
  }

  return (
    <div className="leaflet-bottom map-layer-selector-wrapper">
      <div className="period-select-wrapper">
        <label className="selected-period-label">{i18n.t('mapView.selectedPeriod')}:</label>
        <select value={selectedPeriodValue} onChange={onMapLayerPeriodChange}>
          {periods.map((period) => {
            const value = getPeriodValue(period)
            const label = `${period.year} - ${period.month}`
            return (
              <option key={value} value={value}>
                {label}
              </option>
            )
          })}
        </select>
      </div>
      <div className="slider-wrapper">
        <Slider
          id="map-layer-period-slider"
          value={selectedPeriodValue}
          onChange={onMapLayerPeriodChange}
          className="slider"
          step="1"
          min={getPeriodValue(periods[0])}
          max={getPeriodValue(periods[periods.length - 1])}
          name="map-layer-period"
          options={periods.map((period, index) => {
            const { year } = period
            const value = getPeriodValue(period)
            const showLabel = index === 0 || periods[index - 1].year !== year
            const label = showLabel ? year : null
            return { value, label }
          })}
        />
      </div>
    </div>
  )
}
