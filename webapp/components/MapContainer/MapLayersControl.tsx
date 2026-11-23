import { useCallback, useEffect, useMemo, useState } from 'react'
import { LayersControl, TileLayer, useMapEvents } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as User from '@core/user/user'
import { useUser } from '@webapp/store/user'
import { useSurveyId } from '@webapp/store/survey'
import { useSystemConfigExperimentalFeatures } from '@webapp/store/system'

import { baseLayers, baseLayerTypes, defaultBaseLayer } from './baseLayers'
import { EqualEarthBaseLayer } from './EqualEarthBaseLayer'
import { useMapContext } from './MapContext'
import { MapLayersGroupsInjector } from './MapLayersGroupsInjector'
import { MAP_MIN_ZOOM } from './mapZoom'
import { CustomBaseLayer } from './workspace/customLayers/CustomBaseLayer'
import { findCustomBaseLayerDef, isCustomBaseLayerKey } from './workspace/customLayers/customLayerLeaflet'
import { useMapCustomLayers } from './workspace/customLayers/MapCustomLayersContext'
import { useMapWorkspace } from './workspace/MapWorkspaceContext'
import { useControlContainerMove } from './workspace/layers/useControlContainerMove'
import { getSelectableBaseLayers } from './workspace/toolbar/baseMapItems'

const EMPTY_CONTROL_CLASS = 'map-layers-control--empty'

export const MapLayersControl = (props) => {
  const { layers = [], baseLayersLabel, overlayGroups = [] } = props

  const user = useUser()
  const surveyId = useSurveyId()
  const experimentalFeaturesEnabled = useSystemConfigExperimentalFeatures()
  const { contextObject, onBaseLayerUpdate } = useMapContext()
  const { baseLayer: contextBaseLayer } = contextObject
  const { variant, layersControlTarget } = useMapWorkspace()
  const full = variant === 'full'
  const [control, setControl] = useState(null)
  const { baseMaps: customBaseLayerDefs } = useMapCustomLayers()

  // full map: the control lives in the Layers tab of the rail; compact maps: it stays on the map, collapsed
  useControlContainerMove(full ? control : null, layersControlTarget)

  // compact maps without overlays (location picker, geo panel) show no control (the base map is in the top bar)
  useEffect(() => {
    control?.getContainer()?.classList.toggle(EMPTY_CONTROL_CLASS, !full && layers.length === 0)
  }, [control, full, layers.length])

  // on layer add, set selected layer in map context
  useMapEvents({
    baselayerchange(event) {
      // custom base maps are named by their key ("custom:<uuid>"), never matched against the built-in names
      if (isCustomBaseLayerKey(event.name)) {
        const customBaseLayerDef = findCustomBaseLayerDef({ controlName: event.name, customBaseLayerDefs })
        if (customBaseLayerDef) onBaseLayerUpdate(customBaseLayerDef)
        return
      }
      const baseLayerDef = baseLayers.find((baseLayer) => baseLayer.name === event.name)
      if (baseLayerDef) onBaseLayerUpdate(baseLayerDef)
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
    const selectableBaseLayers = getSelectableBaseLayers({
      baseLayers,
      experimentalFeaturesEnabled: Boolean(experimentalFeaturesEnabled),
      hasApiKey: (provider) => Boolean(User.getMapApiKey({ provider })(user)),
    })
    const result = []
    for (const baseLayer of selectableBaseLayers) {
      const {
        key,
        apiKeyRequired,
        name,
        attribution,
        provider,
        maxZoom = 17,
        type,
        url,
        style,
        crossOrigin = false,
      } = baseLayer

      // Equal Earth is never pre-selected (defaultBaseLayer skips it)
      const checked = contextBaseLayer ? contextBaseLayer.key === key : baseLayer === defaultBaseLayer

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
          <TileLayer
            id={key}
            attribution={attribution}
            url={tileUrl}
            maxZoom={maxZoom}
            minZoom={MAP_MIN_ZOOM}
            crossOrigin={crossOrigin ? 'anonymous' : undefined}
          />
        </LayersControl.BaseLayer>
      )
    }
    return result
  }, [contextBaseLayer, experimentalFeaturesEnabled, getTileUrl, user])

  // custom WMS / WMTS / XYZ base maps: rendered apart from the built-in ones, without crossOrigin (their hosts may
  // not send CORS headers)
  const customBaseLayersControls = useMemo(
    () =>
      customBaseLayerDefs.map((def) => (
        <LayersControl.BaseLayer key={def.key} name={def.name} checked={contextBaseLayer?.key === def.key}>
          <CustomBaseLayer layer={def.custom} />
        </LayersControl.BaseLayer>
      )),
    [contextBaseLayer, customBaseLayerDefs]
  )

  const showGroupsInjector = baseLayersLabel || overlayGroups.length > 0

  return (
    <>
      {/* collapsed is read only when the control is created; the variant of a map never changes */}
      <LayersControl ref={setControl} autoZIndex position="topright" collapsed={!full}>
        {baseLayersControls}
        {customBaseLayersControls}
        {layers}
      </LayersControl>
      {showGroupsInjector && (
        <MapLayersGroupsInjector control={control} baseLayersLabel={baseLayersLabel} overlayGroups={overlayGroups} />
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
