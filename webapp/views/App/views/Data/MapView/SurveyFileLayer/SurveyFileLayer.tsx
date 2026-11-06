import { useCallback, useEffect, useRef } from 'react'
import { LayerGroup, LayersControl, useMap } from 'react-leaflet'
import type L from 'leaflet'

import { useNotifyError } from '@webapp/components/hooks'
import { fetchSurveyFileAsFile, type SurveyFileRef } from '@webapp/components/MapContainer/fileLayers'
import {
  getReadErrorDetails,
  readFileLayerGroup,
} from '@webapp/components/MapContainer/workspace/uploaded/readUploadedFile'
import { useSurveyId } from '@webapp/store/survey'

import { useMapLayerToggle } from '../common'

type Props = {
  // its label is the overlay name in the layers control
  surveyFile: SurveyFileRef
}

/**
 * Overlay showing a survey file (preloaded map layer, area of interest), downloaded when the overlay is checked.
 * @param {Props} props - The props.
 * @returns {React.ReactElement} The overlay.
 */
export const SurveyFileLayer = (props: Props) => {
  const { surveyFile } = props
  const { fileUuid, fileName, label } = surveyFile

  const map = useMap()
  const surveyId = useSurveyId()
  const notifyError = useNotifyError()

  const layerRef = useRef<L.FeatureGroup | null>(null)

  const layerName = label || fileName

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
  }, [fileUuid, fileName, surveyId, removePreviousLayer, map, notifyError])

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
