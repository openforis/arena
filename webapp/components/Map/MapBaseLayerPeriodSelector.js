import './MapBaseLayerPeriodSelector.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { useMap, TileLayer } from 'react-leaflet'
import L from 'leaflet'
require('leaflet-side-by-side')

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import * as API from '@webapp/service/api'

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

const Proc = {
  rgb: 'rgb',
  cir: 'cir',
}

let sideBySideObject = null

export const MapBaseLayerPeriodSelector = () => {
  const map = useMap()
  const contextBaseLayer = useMapContextBaseLayer()
  const { onBaseLayerUpdate } = useMapContext()
  const { periodSelectorAvailable, provider, periodType } = contextBaseLayer

  const i18n = useI18n()
  const user = useUser()
  const [state, setState] = useState({
    ready: false,
    periods: [],
    periodByValue: {},
    selectedPeriodValueLeft: null,
    selectedPeriodValueRight: null,
    leftChecked: false,
    rightChecked: false,
    procLeft: Proc.rgb,
    procRight: Proc.rgb,
  })

  const apiKey = User.getMapApiKey({ provider })(user)

  const {
    ready,
    periods,
    periodByValue,
    selectedPeriodValueLeft,
    selectedPeriodValueRight,
    leftChecked,
    rightChecked,
    procLeft,
    procRight,
  } = state

  const getLayer = (isLeft) => {
    if (isLeft) {
      return Object.values(map._layers).find((layer) => layer.options.id !== 'right')
    } else {
      return Object.values(map._layers).find((layer) => layer.options.id === 'right')
    }
  }
  const initSideBySide = () => {
    const layerLeft = getLayer(true)
    const layerRight = getLayer(false)
    if (layerLeft && layerRight) {
      sideBySideObject = L.control.sideBySide(layerLeft, layerRight).addTo(map)
      const url = baseLayerUrlByProviderFunction[provider]({ selectedPeriodValueRight, apiKey })
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
        selectedPeriodValueRight: '',
        procLeft: Proc.rgb,
        procRight: Proc.rgb,
      })
    })()
  }, [periodSelectorAvailable, provider, periodType, ready])

  const onMapLayerPeriodChange = useCallback(
    (isLeft) => (event) => {
      const periodValue = event.target.value
      // replace url in current layer
      let layer
      if (isLeft) {
        layer = getLayer(true)
      } else {
        layer = getLayer(false)
      }
      if (layer) {
        const period = periodByValue[periodValue]
        let url = baseLayerUrlByProviderFunction[provider]({ period, apiKey })
        url += '&proc=' + (isLeft ? procLeft : procRight)
        layer.setUrl(url)
        onBaseLayerUpdate({ ...contextBaseLayer, url })
        // update state
        if (isLeft) {
          setState((statePrev) => ({ ...statePrev, selectedPeriodValueLeft: Number(periodValue) }))
          sideBySideObject.setLeftLayers(layer)
        } else {
          setState((statePrev) => ({ ...statePrev, selectedPeriodValueRight: Number(periodValue) }))
          sideBySideObject.setRightLayers(layer)
        }
      }
    },
    [map, contextBaseLayer, provider, onBaseLayerUpdate, state]
  )

  const onCheckboxValueChange = (isLeft) => () => {
    let newProc
    if (isLeft) {
      newProc = !leftChecked ? Proc.cir : Proc.rgb
      setState((statePev) => ({ ...statePev, leftChecked: !statePev.leftChecked, procLeft: newProc }))
    } else {
      newProc = !rightChecked ? Proc.cir : Proc.rgb
      setState((statePev) => ({ ...statePev, rightChecked: !statePev.rightChecked, procRight: newProc }))
    }
    const layer = getLayer(isLeft)
    if (layer) {
      const periodValue = isLeft ? selectedPeriodValueLeft : selectedPeriodValueRight
      const period = periodByValue[periodValue]
      let url = baseLayerUrlByProviderFunction[provider]({ period, apiKey })
      url += '&proc=' + newProc
      layer.setUrl(url)
      onBaseLayerUpdate({ ...contextBaseLayer, url })
    }
  }

  if (!periodSelectorAvailable || !provider || !ready) return null

  return (
    <div className="leaflet-bottom map-layer-selector-wrapper">
      <div className="period-select-wrapper-left">
        <select value={selectedPeriodValueLeft} onChange={onMapLayerPeriodChange(true)}>
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
        <input
          type="checkbox"
          value={leftChecked}
          onChange={onCheckboxValueChange(true)}
          id="checkbox-left"
          name="checkbox-left"
        />
        <label htmlFor="checkbox-left">False Color</label>
      </div>
      <div className="period-select-wrapper-right">
        <select value={selectedPeriodValueRight} onChange={onMapLayerPeriodChange(false)}>
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
          <option value={''}>Choose a period</option>
        </select>
        <input
          type="checkbox"
          value={rightChecked}
          onChange={onCheckboxValueChange(false)}
          id="checkbox-right"
          name="checkbox-righ"
        />
        <label htmlFor="checkbox-right">{i18n.t('mapBaseLayerPeriodSelector.falseColor')}</label>
      </div>

      <TileLayer id={'right'} attribution={''} url={''} maxZoom={17} minZoom={3} />
    </div>
  )
}
