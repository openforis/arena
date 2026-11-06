import { useCallback, useEffect, useRef } from 'react'
import { LayerGroup, LayersControl, useMap } from 'react-leaflet'
import type L from 'leaflet'

import type { SurveyFile as SurveyFileModel } from '@openforis/arena-core'

import * as SurveyFile from '@core/survey/surveyFile'
import { useNotifyError } from '@webapp/components/hooks'
import { fetchSurveyFileAsFile } from '@webapp/components/MapContainer/fileLayers'
import {
  getReadErrorDetails,
  readFileLayerGroup,
} from '@webapp/components/MapContainer/workspace/uploaded/readUploadedFile'
import { useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'

import { useMapLayerToggle } from '../common'

type Props = {
  preloadedMapLayer: SurveyFileModel
}

export const PreloadedLayer = (props: Props) => {
  const { preloadedMapLayer } = props

  const map = useMap()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()
  const notifyError = useNotifyError()

  const layerRef = useRef<L.FeatureGroup | null>(null)

  const fileUuid = SurveyFile.getUuid(preloadedMapLayer)
  const layerName = SurveyFile.getLabel(lang)(preloadedMapLayer)

  const removePreviousLayer = useCallback(() => {
    const layer = layerRef.current
    if (layer) {
      map.removeLayer(layer)
      layerRef.current = null
    }
  }, [map])

  const fetchDataAndAddLayerToMap = useCallback(async () => {
    if (!fileUuid || !surveyId) return
    removePreviousLayer()
    try {
      const fileName = SurveyFile.getName(preloadedMapLayer)
      const layer = await readFileLayerGroup(await fetchSurveyFileAsFile({ surveyId, fileUuid, fileName }))
      layerRef.current = layer
      map.addLayer(layer)
      const bounds = layer.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds)
      }
    } catch (error) {
      notifyError({ key: 'mapWorkspace.upload.error', params: { details: getReadErrorDetails(error) } })
    }
  }, [fileUuid, surveyId, removePreviousLayer, preloadedMapLayer, map, notifyError])

  useEffect(() => {
    // Cleanup on unmount
    return removePreviousLayer
  }, [removePreviousLayer])

  useMapLayerToggle({
    layerName,
    onAdd: fetchDataAndAddLayerToMap,
    onRemove: removePreviousLayer,
  })

  // Render the overlay for MapLayersControl
  return (
    <LayersControl.Overlay name={layerName}>
      <LayerGroup />
    </LayersControl.Overlay>
  )
}
