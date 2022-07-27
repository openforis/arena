import './MapBaseLayerPeriodSelector.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { useMap, TileLayer } from 'react-leaflet'

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import * as API from '@webapp/service/api'

import L from 'leaflet'

// eslint-disable-next-line
import sideBySide from './leaflet-side-by-side' //This import is required even though it is never read, it will still import the sideBySide to L.control

import { baseLayerUrlByProviderFunction } from './baseLayers'
import { useMapContext, useMapContextBaseLayer } from './MapContext'

const getPeriodValue = (period) => {
  const { year, month, yearTo } = period
  if (yearTo) {
    // biannual periods
    return year * 2 + (month <= 6 ? 0 : 1)
  }
  // montly periods
  return year * 12 + month
}

let sideBySideObject = null

export const MapBaseLayerPeriodSelector = () => {
  const map = useMap()
  const contextBaseLayer = useMapContextBaseLayer()
  const { onBaseLayerUpdate } = useMapContext()
  const { periodSelectorAvailable, provider, periodType } = contextBaseLayer

  const i18n = useI18n()
  const user = useUser()
  const [state, setState] = useState({ ready: false, periods: [], periodByValue: {}, selectedPeriodValue: null })

  const apiKey = User.getMapApiKey({ provider })(user)

  const { ready, periods, periodByValue, selectedPeriodValueLeft, selectedPeriodValueRight } = state

  const initSideBySide = () => {
    const layerLeft = Object.values(map._layers).find((layer) => layer.options.id !== 'side')
    const layerRight = Object.values(map._layers).find((layer) => layer.options.id === 'side')
    if (layerLeft && layerRight) {
      sideBySideObject = L.control.sideBySide(layerLeft, layerRight).addTo(map)
      const url = baseLayerUrlByProviderFunction[provider]({ selectedPeriodValueRight, apiKey })
      layerRight.setUrl(url)
      onBaseLayerUpdate({ ...contextBaseLayer, url })
    }
  }

  useEffect(() => {
    if (!periodSelectorAvailable || !provider) {
      if (sideBySideObject != null) {
        sideBySideObject.remove()
        sideBySideObject = null
      }
      return
    }
    if (sideBySideObject == null) {
      initSideBySide()
    }
    ;(async () => {
      const availablePeriods = await API.fetchAvailableMapPeriods({
        provider,
        periodType,
      })
      const lastPeriodValue = getPeriodValue(availablePeriods[availablePeriods.length - 1])
      setState({
        ready: true,
        periods: availablePeriods,
        periodByValue: availablePeriods.reduce((acc, period) => ({ ...acc, [getPeriodValue(period)]: period }), {}),
        selectedPeriodValueLeft: lastPeriodValue,
        selectedPeriodValueRight: lastPeriodValue,
      })
    })()
  }, [periodSelectorAvailable, provider, periodType, ready])

  const onMapLayerPeriodChangeLeft = useCallback(
    (event) => {
      const periodValue = event.target.value
      // replace url in current layer
      const layer = Object.values(map._layers).find((layer) => layer.options.id !== 'side')
      if (layer) {
        const period = periodByValue[periodValue]
        const url = baseLayerUrlByProviderFunction[provider]({ period, apiKey })
        layer.setUrl(url)
        onBaseLayerUpdate({ ...contextBaseLayer, url })
        // update state
        setState((statePrev) => ({ ...statePrev, selectedPeriodValueLeft: Number(periodValue) }))
        sideBySideObject.setLeftLayers(layer)
      }
    },
    [map, contextBaseLayer, provider, onBaseLayerUpdate, setState]
  )
  const onMapLayerPeriodChangeRight = useCallback(
    (event) => {
      const periodValue = event.target.value
      const period = periodByValue[periodValue]

      // replace url in current layer
      const layer = Object.values(map._layers).find((layer) => layer.options.id === 'side')
      if (layer) {
        const url = baseLayerUrlByProviderFunction[provider]({ period, apiKey })
        layer.setUrl(url)
        onBaseLayerUpdate({ ...contextBaseLayer, url })
        // update state
        setState((statePrev) => ({ ...statePrev, selectedPeriodValueRight: Number(periodValue) }))
        sideBySideObject.setRightLayers(layer)
      }
    },
    [map, contextBaseLayer, provider, onBaseLayerUpdate, setState]
  )

  if (!periodSelectorAvailable || !provider || !ready) return null

  return (
    <div className="leaflet-bottom map-layer-selector-wrapper">
      <div className="period-select-wrapper">
        <label className="selected-period-label">{i18n.t('mapView.selectedPeriod')}:</label>
        <select value={selectedPeriodValueLeft} onChange={onMapLayerPeriodChangeLeft}>
          {periods.map((period) => {
            const value = getPeriodValue(period)
            const label =
              `${period.year} - ${period.month}` + (period.yearTo ? ` / ${period.yearTo} - ${period.monthTo}` : '')
            return (
              <option key={value} value={value}>
                {label}
              </option>
            )
          })}
        </select>
        <select value={selectedPeriodValueRight} onChange={onMapLayerPeriodChangeRight}>
          {periods.map((period) => {
            const value = getPeriodValue(period)
            const label =
              `${period.year} - ${period.month}` + (period.yearTo ? ` / ${period.yearTo} - ${period.monthTo}` : '')
            return (
              <option key={value} value={value}>
                {label}
              </option>
            )
          })}
        </select>
        <TileLayer id={'side'} attribution={''} url={''} maxZoom={22} minZoom={3} />
      </div>
    </div>
  )
}
