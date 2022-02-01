import './MapLayerPeriodSelector.scss'

import React, { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import { fetchAvailableMapPeriods } from '@webapp/service/api/map'
import Select from '../form/Select'

import { baseLayerUrlByProviderFunction, planetAttribution } from './baseLayers'
import { useMapContextBaseLayer } from './MapContext'

const getPeriodValue = (period) => {
  const { year, month } = period
  return year * 12 + month
}

export const MapBaseLayerPeriodSelector = () => {
  const map = useMap()
  const baseLayerDef = useMapContextBaseLayer()
  const { periodSelectorAvailable, provider } = baseLayerDef

  const i18n = useI18n()
  const user = useUser()
  const apiKey = User.getMapApiKey({ provider })(user)

  const [state, setState] = useState({ ready: false, periods: [], periodByValue: {}, selectedPeriodValue: null })
  const { ready, periods, periodByValue, selectedPeriodValue } = state

  useEffect(() => {
    if (!periodSelectorAvailable || !provider || !apiKey) return
    ;(async () => {
      const availablePeriods = await fetchAvailableMapPeriods({ provider, apiKey })
      setState({
        ready: true,
        periods: availablePeriods,
        periodByValue: availablePeriods.reduce((acc, period) => ({ ...acc, [getPeriodValue(period)]: period }), {}),
        selectedPeriodValue: getPeriodValue(availablePeriods[availablePeriods.length - 1]),
      })
    })()
  }, [periodSelectorAvailable, provider, apiKey])

  if (!periodSelectorAvailable || !provider || !ready) return null

  const onMapLayerPeriodChange = (periodValue) => {
    // remove previously selected basemap layer from map
    Object.values(map._layers).forEach((layer) => {
      if (layer._url) {
        map.removeLayer(layer)
      }
    })

    // add new layer to map
    const period = periodByValue[periodValue]
    const url = baseLayerUrlByProviderFunction[provider]({ period, apiKey })
    map.addLayer(L.tileLayer(url, { attribution: planetAttribution }))

    // update state
    setState((statePrev) => ({ ...statePrev, selectedPeriodValue: periodValue }))
  }

  return (
    <div className="leaflet-bottom map-layer-selector-wrapper">
      <div className="period-select-wrapper">
        <label className="selected-period-label">{i18n.t('mapView.selectedPeriod')}:</label>
        <select value={selectedPeriodValue} onChange={(e) => onMapLayerPeriodChange(e.target.value)}>
          {periods.map((period) => (
            <option value={getPeriodValue(period)}>{`${period.year} - ${period.month}`}</option>
          ))}
        </select>
      </div>
      <input
        id="map-layer-slider"
        value={selectedPeriodValue}
        onChange={(e) => onMapLayerPeriodChange(e.target.value)}
        className="slider"
        type="range"
        step="1"
        min={getPeriodValue(periods[0])}
        max={getPeriodValue(periods[periods.length - 1])}
        name="map-layer-period"
        list={`layers-dl-${provider}`}
      />

      <datalist id="planet-layers-dl">
        {periods.map((period, index) => {
          const { year } = period
          const value = getPeriodValue(period)
          const showLabel = index === 0 || periods[index - 1].year !== year
          const label = showLabel ? year : null
          return <option key={value} value={value} label={label} />
        })}
      </datalist>
    </div>
  )
}
