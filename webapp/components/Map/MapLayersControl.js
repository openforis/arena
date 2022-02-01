import React from 'react'
import { LayersControl, TileLayer, useMapEvents } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'
import { baseLayers } from './baseLayers'
import { useMapContext } from './MapContext'

const getTileUrl = ({ url, apiKeyRequired, provider, user }) => {
  if (apiKeyRequired) {
    const apiKey = User.getMapApiKey({ provider })(user)
    if (apiKey) {
      return url({ apiKey })
    } else {
      return null
    }
  } else {
    return url
  }
}

export const MapLayersControl = (props) => {
  const { layers } = props

  const user = useUser()
  const { onBaseLayerUpdate } = useMapContext()

  // on layer add, set selected layer in map context
  useMapEvents({
    baselayerchange(event) {
      const baseLayerDef = baseLayers.find((baseLayer) => baseLayer.name === event.name)
      onBaseLayerUpdate(baseLayerDef)
    },
  })

  return (
    <LayersControl position="topright">
      {baseLayers.reduce((acc, { key, apiKeyRequired, name, attribution, provider, url }, index) => {
        const tileUrl = getTileUrl({ url, apiKeyRequired, provider, user })
        if (!tileUrl) return acc
        return [
          ...acc,
          <LayersControl.BaseLayer key={key} name={name} checked={index === 0}>
            <TileLayer attribution={attribution} url={tileUrl} />
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
