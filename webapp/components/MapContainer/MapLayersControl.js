import React, { useCallback, useMemo } from 'react'
import { LayersControl, TileLayer, useMapEvents } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'
import { useSurveyId } from '@webapp/store/survey'

import { baseLayers } from './baseLayers'
import { EqualEarthBaseLayer } from './EqualEarthBaseLayer'
import { useMapContext } from './MapContext'
import { MapLayersGroupsInjector } from './MapLayersGroupsInjector'
import { WmtsComponent } from './WmtsComponent'

export const MapLayersControl = (props) => {
  const { layers = [], baseLayersLabel, overlayGroups = [], equalEarthAsDefault = false } = props

  const user = useUser()
  const surveyId = useSurveyId()
  const { contextObject, onBaseLayerUpdate } = useMapContext()
  const { baseLayer: contextBaseLayer } = contextObject

  // on layer add, set selected layer in map context
  useMapEvents({
    baselayerchange(event) {
      const baseLayerDef = baseLayers.find((baseLayer) => baseLayer.name === event.name)
      onBaseLayerUpdate(baseLayerDef)
    },
  })

  const getTileUrl = useCallback(
    ({ url, apiKeyRequired, provider, user }) => {
      if (typeof url === 'string') {
        return url
      }
      if (apiKeyRequired) {
        const apiKey = User.getMapApiKey({ provider })(user)
        return apiKey ? url({ apiKey }) : null
      }
      return url({ surveyId })
    },
    [surveyId]
  )

  // The array itself keeps the Equal Earth entry first (so it's first in the switcher's
  // list everywhere), but only equalEarthAsDefault callers (MapView) should have it
  // pre-selected - other consumers (e.g. the record-editing coordinate picker) fall back
  // to the first non-maplibre entry, matching this app's pre-experiment default.
  const defaultBaseLayer = useMemo(
    () =>
      equalEarthAsDefault
        ? baseLayers[0]
        : (baseLayers.find((baseLayer) => baseLayer.type !== 'maplibre') ?? baseLayers[0]),
    [equalEarthAsDefault]
  )

  const baseLayersControls = useMemo(() => {
    const result = []
    for (const baseLayer of baseLayers) {
      const { key, apiKeyRequired, name, attribution, provider, maxZoom = 17, type, url, style } = baseLayer

      const checked = (!contextBaseLayer && baseLayer === defaultBaseLayer) || contextBaseLayer?.name === name

      if (type === 'maplibre') {
        result.push(
          <LayersControl.BaseLayer key={key} name={name} checked={checked}>
            <EqualEarthBaseLayer style={style} attribution={attribution} />
          </LayersControl.BaseLayer>
        )
        continue
      }

      const tileUrl = getTileUrl({ url, apiKeyRequired, provider, user })
      if (!tileUrl) {
        continue
      }

      result.push(
        <LayersControl.BaseLayer key={key} name={name} checked={checked}>
          <TileLayer id={key} attribution={attribution} url={tileUrl} maxZoom={maxZoom} minZoom={3} />
        </LayersControl.BaseLayer>
      )
    }
    return result
  }, [contextBaseLayer, defaultBaseLayer, getTileUrl, user])

  const showGroupsInjector = baseLayersLabel || overlayGroups.length > 0

  return (
    <>
      <LayersControl autoZIndex position="topright">
        {baseLayersControls}
        <WmtsComponent />
        {layers}
      </LayersControl>
      {showGroupsInjector && (
        <MapLayersGroupsInjector baseLayersLabel={baseLayersLabel} overlayGroups={overlayGroups} />
      )}
    </>
  )
}

MapLayersControl.propTypes = {
  baseLayersLabel: PropTypes.string,
  equalEarthAsDefault: PropTypes.bool,
  layers: PropTypes.array,
  overlayGroups: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
}
