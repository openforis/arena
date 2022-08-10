import './MapBaseLayerPeriodSelector.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { useMap, TileLayer } from 'react-leaflet'

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import * as API from '@webapp/service/api'

import L from 'leaflet'

require('./leaflet-side-by-side')
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

  const initSideBySide = () => {
    if (User.isSystemAdmin(user)) {
      const layerLeft = Object.values(map._layers).find((layer) => layer.options.id !== 'side')
      const layerRight = Object.values(map._layers).find((layer) => layer.options.id === 'side')
      if (layerLeft && layerRight) {
        sideBySideObject = L.control.sideBySide(layerLeft, layerRight).addTo(map)
        const url = baseLayerUrlByProviderFunction[provider]({ selectedPeriodValueRight, apiKey })
        layerRight.setUrl(url)
        onBaseLayerUpdate({ ...contextBaseLayer, url })
      }
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
        layer = Object.values(map._layers).find((layer) => layer.options.id !== 'side')
      } else {
        layer = Object.values(map._layers).find((layer) => layer.options.id === 'side')
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
    let layer
    if (isLeft) {
      layer = Object.values(map._layers).find((layer) => layer.options.id !== 'side')
    } else {
      layer = Object.values(map._layers).find((layer) => layer.options.id === 'side')
    }
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
      {User.isSystemAdmin(user) && (
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
      )}
      <TileLayer id={'side'} attribution={''} url={''} maxZoom={17} minZoom={3} />
    </div>
  )
}
