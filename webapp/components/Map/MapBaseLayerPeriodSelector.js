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
import { useMapContextBaseLayer } from './MapContext'
import { Checkbox } from '../form'

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

const PERIOD_EMPTY_VALUE = ''

let sideBySideObject = null

export const MapBaseLayerPeriodSelector = () => {
  const map = useMap()
  const contextBaseLayer = useMapContextBaseLayer()
  const { periodSelectorAvailable, provider, periodType } = contextBaseLayer

  const i18n = useI18n()
  const user = useUser()
  const [state, setState] = useState({
    ready: false,
    periods: [],
    periodByValue: {},
    selectedPeriodValueLeft: null,
    selectedPeriodValueRight: null,
    falseColorLeftChecked: false,
    falseColorRightChecked: false,
  })

  const apiKey = User.getMapApiKey({ provider })(user)

  const {
    ready,
    periods,
    periodByValue,
    selectedPeriodValueLeft,
    selectedPeriodValueRight,
    falseColorLeftChecked,
    falseColorRightChecked,
  } = state

  const procLeft = falseColorLeftChecked ? Proc.cir : Proc.rgb
  const procRight = falseColorRightChecked ? Proc.cir : Proc.rgb

  // fetch available periods on provider change
  useEffect(() => {
    if (!periodSelectorAvailable || !provider) {
      return
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
        selectedPeriodValueRight: PERIOD_EMPTY_VALUE,
        falseColorLeftChecked: false,
        falseColorRightChecked: false,
      })
    })()
  }, [periodSelectorAvailable, provider, periodType])

  const getLayer = useCallback(
    (isLeft) =>
      Object.values(map._layers).find(
        (layer) => (isLeft && layer.options.id !== 'right') || (!isLeft && layer.options.id === 'right')
      ),
    [map._layers]
  )

  const updateSideBySide = useCallback(() => {
    const layerLeft = getLayer(true)
    const layerRight = getLayer(false)
    if (layerLeft && layerRight && selectedPeriodValueLeft && selectedPeriodValueRight) {
      if (sideBySideObject) {
        sideBySideObject.setLeftLayers(layerLeft)
        sideBySideObject.setRightLayers(layerRight)
      } else {
        sideBySideObject = L.control.sideBySide(layerLeft, layerRight).addTo(map)
      }
    } else if (sideBySideObject) {
      sideBySideObject.remove()
      sideBySideObject = null
    }
  }, [getLayer, map, selectedPeriodValueLeft, selectedPeriodValueRight])

  // update side by side on selections change
  useEffect(() => {
    updateSideBySide()
  }, [
    updateSideBySide,
    falseColorLeftChecked,
    falseColorRightChecked,
    selectedPeriodValueLeft,
    selectedPeriodValueRight,
  ])

  const updateLayer = useCallback(
    (isLeft) => {
      const layer = getLayer(isLeft)
      if (layer && provider) {
        const periodValue = isLeft ? selectedPeriodValueLeft : selectedPeriodValueRight
        const period = periodByValue[periodValue]
        const proc = isLeft ? procLeft : procRight
        const baseLayerUrlFunction = baseLayerUrlByProviderFunction[provider]
        if (baseLayerUrlFunction) {
          const url = `${baseLayerUrlFunction({ period, apiKey })}&proc=${proc}`
          if (layer._url !== url) {
            layer.setUrl(url)
          }
        }
      }
    },
    [apiKey, getLayer, periodByValue, procLeft, procRight, provider, selectedPeriodValueLeft, selectedPeriodValueRight]
  )

  // update layers on selections change
  useEffect(() => {
    updateLayer(false)
  }, [updateLayer, provider, falseColorRightChecked, selectedPeriodValueRight])

  useEffect(() => {
    updateLayer(true)
  }, [updateLayer, provider, falseColorLeftChecked, selectedPeriodValueLeft])

  const onMapLayerPeriodChange = useCallback((isLeft, event) => {
    const value = event.target.value
    const periodValue = value ? Number(value) : PERIOD_EMPTY_VALUE
    const prop = isLeft ? 'selectedPeriodValueLeft' : 'selectedPeriodValueRight'
    setState((statePrev) => ({ ...statePrev, [prop]: periodValue }))
  }, [])

  const onMapLayerPeriodChangeLeft = useCallback(
    (event) => onMapLayerPeriodChange(true, event),
    [onMapLayerPeriodChange]
  )
  const onMapLayerPeriodChangeRight = useCallback(
    (event) => onMapLayerPeriodChange(false, event),
    [onMapLayerPeriodChange]
  )

  const toggleFalseColor = useCallback((isLeft) => {
    const prop = isLeft ? 'falseColorLeftChecked' : 'falseColorRightChecked'
    setState((statePrev) => ({ ...statePrev, [prop]: !statePrev[prop] }))
  }, [])

  const toggleFalseColorLeft = useCallback(() => toggleFalseColor(true), [toggleFalseColor])
  const toggleFalseColorRight = useCallback(() => toggleFalseColor(false), [toggleFalseColor])

  if (!periodSelectorAvailable || !provider || !ready) return null

  return (
    <div className="leaflet-bottom map-layer-selector-wrapper">
      <div className="period-select-wrapper-left">
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
        <Checkbox
          checked={falseColorLeftChecked}
          onChange={toggleFalseColorLeft}
          label={'mapBaseLayerPeriodSelector.falseColor'}
        />
      </div>
      <div className="period-select-wrapper-right">
        <select value={selectedPeriodValueRight} onChange={onMapLayerPeriodChangeRight}>
          <option value={PERIOD_EMPTY_VALUE}>{i18n.t('mapBaseLayerPeriodSelector.chooseAPeriodToCompareWith')}</option>

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
        {selectedPeriodValueRight && (
          <Checkbox
            checked={falseColorRightChecked}
            onChange={toggleFalseColorRight}
            label={'mapBaseLayerPeriodSelector.falseColor'}
          />
        )}
      </div>

      <TileLayer id={'right'} attribution={''} url={''} maxZoom={17} minZoom={3} />
    </div>
  )
}
