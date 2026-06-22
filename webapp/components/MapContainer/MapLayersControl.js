import React, { useCallback, useMemo } from 'react'
import { LayersControl, TileLayer, useMapEvents } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'
import { useSurveyId } from '@webapp/store/survey'

import { baseLayers } from './baseLayers'
import { useMapContext } from './MapContext'
import { MapLayersGroupsInjector } from './MapLayersGroupsInjector'
import { WmtsComponent } from './WmtsComponent'

export const MapLayersControl = (props) => {
  const { layers = [], baseLayersLabel, overlayGroups = [] } = props

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

  const baseLayersControls = useMemo(() => {
    const result = []
    for (let index = 0; index < baseLayers.length; index++) {
      const baseLayer = baseLayers[index]
      const { key, apiKeyRequired, name, attribution, provider, maxZoom = 17, url } = baseLayer

      const tileUrl = getTileUrl({ url, apiKeyRequired, provider, user })
      if (!tileUrl) {
        continue
      }

      const checked = (!contextBaseLayer && index === 0) || contextBaseLayer?.name === name

      result.push(
        <LayersControl.BaseLayer key={key} name={name} checked={checked}>
          <TileLayer id={key} attribution={attribution} url={tileUrl} maxZoom={maxZoom} minZoom={3} />
        </LayersControl.BaseLayer>
      )
    }
    return result
  }, [contextBaseLayer, getTileUrl, user])

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
