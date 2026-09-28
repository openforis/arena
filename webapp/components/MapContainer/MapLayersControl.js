import React, { useCallback, useMemo } from 'react'
import { LayersControl, TileLayer, useMapEvents } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'
import { useSurveyId } from '@webapp/store/survey'
import { useSystemConfigExperimentalFeatures } from '@webapp/store/system'

import { baseLayers, baseLayerTypes } from './baseLayers'
import { EqualEarthBaseLayer } from './EqualEarthBaseLayer'
import { useMapContext } from './MapContext'
import { MapLayersGroupsInjector } from './MapLayersGroupsInjector'
import { WmtsComponent } from './WmtsComponent'

export const MapLayersControl = (props) => {
  const { layers = [], baseLayersLabel, overlayGroups = [] } = props

  const user = useUser()
  const surveyId = useSurveyId()
  const experimentalFeaturesEnabled = useSystemConfigExperimentalFeatures()
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

  // Equal Earth is experimental: hidden from the switcher unless EXPERIMENTAL_FEATURES is
  // enabled, and never pre-selected as the default base layer even when visible.
  const defaultBaseLayer = useMemo(
    () => baseLayers.find((baseLayer) => baseLayer.type !== baseLayerTypes.maplibre) ?? baseLayers[0],
    []
  )

  const baseLayersControls = useMemo(() => {
    const result = []
    for (const baseLayer of baseLayers) {
      const { key, apiKeyRequired, name, attribution, provider, maxZoom = 17, type, url, style } = baseLayer

      if (type === baseLayerTypes.maplibre && !experimentalFeaturesEnabled) {
        continue
      }

      const checked = (!contextBaseLayer && baseLayer === defaultBaseLayer) || contextBaseLayer?.name === name

      if (type === baseLayerTypes.maplibre) {
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
  }, [contextBaseLayer, defaultBaseLayer, experimentalFeaturesEnabled, getTileUrl, user])

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
  layers: PropTypes.array,
  overlayGroups: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
}
