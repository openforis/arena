import React, { useCallback } from 'react'
import { LayersControl, TileLayer, useMapEvents } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'
import { baseLayers } from './baseLayers'
import { useMapContext } from './MapContext'

export const MapLayersControl = (props) => {
  const { layers } = props

  const user = useUser()
  const { contextObject, onBaseLayerUpdate } = useMapContext()
  const { baseLayer: contextBaseLayer } = contextObject

  // on layer add, set selected layer in map context
  useMapEvents({
    zoomend(event) {
      console.log(event)
    },
    baselayerchange(event) {
      const baseLayerDef = baseLayers.find((baseLayer) => baseLayer.name === event.name)
      onBaseLayerUpdate(baseLayerDef)
    },
  })

  const getTileUrl = useCallback(
    ({ url, apiKeyRequired, provider, user }) => {
      if (!apiKeyRequired || typeof url === 'string') {
        return url
      }
      const apiKey = User.getMapApiKey({ provider })(user)
      return apiKey ? url({ apiKey }) : null
    },
    [user]
  )

  return (
    <LayersControl position="topright">
      {baseLayers.reduce((acc, baseLayer, index) => {
        const { key, apiKeyRequired, name, attribution, provider, maxZoom = 17, url } = baseLayer

        const tileUrl = getTileUrl({ url, apiKeyRequired, provider, user })
        if (!tileUrl) return acc

        const checked = (!contextBaseLayer && index === 0) || contextBaseLayer?.name === name

        return [
          ...acc,
          <LayersControl.BaseLayer key={key} name={name} checked={checked}>
            <TileLayer id={key} attribution={attribution} url={tileUrl} maxZoom={maxZoom} />
          </LayersControl.BaseLayer>,
        ]
      }, [])}
      {layers}
    </LayersControl>
  )
}

MapLayersControl.propTypes = {
  layers: PropTypes.array,
}

MapLayersControl.defaultProps = {
  layers: [],
}
