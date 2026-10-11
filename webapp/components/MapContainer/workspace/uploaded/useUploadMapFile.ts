import { useCallback } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'

import { uuidv4 } from '@core/uuid'
import { useNotifyError, useNotifyWarning } from '@webapp/components/hooks'

import { useMapCustomOverlays } from '../layers/MapCustomOverlaysContext'
import { exitFullScreen } from '../tools/useFullScreen'
import { readUploadedFile, setUploadedLayerOpacity } from './readUploadedFile'
import { getUploadedFileKind } from './uploadedFiles'

const UPLOADED_LAYER_OPACITY = 0.8

/**
 * Returns a function that reads a file, adds its layers to the map (group "Uploaded files") and zooms to them;
 * unsupported or unreadable files show a message and leave the map as it is.
 * @returns {Function} (file) => Promise<void>.
 */
export const useUploadMapFile = (): ((file: File) => Promise<void>) => {
  const map = useMap()
  const { addOverlay } = useMapCustomOverlays()
  const notifyWarning = useNotifyWarning()
  const notifyError = useNotifyError()

  return useCallback(
    async (file: File) => {
      const kind = getUploadedFileKind(file.name)
      if (!kind) {
        // app notifications render outside the workspace: invisible in full screen
        exitFullScreen()
        notifyWarning({ key: 'mapWorkspace.upload.unsupported' })
        return
      }
      try {
        const layers = await readUploadedFile(file, kind)
        const bounds = L.latLngBounds([])
        for (const [index, layer] of layers.entries()) {
          addOverlay({
            id: `uploaded-${uuidv4()}`,
            group: 'uploaded',
            name: layers.length > 1 ? `${file.name} (${index + 1})` : file.name,
            layer,
            opacity: UPLOADED_LAYER_OPACITY,
            setOpacity: setUploadedLayerOpacity,
          })
          if (layer instanceof L.FeatureGroup) bounds.extend(layer.getBounds())
        }
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 })
      } catch (error) {
        const details = error instanceof Error ? error.message : String(error)
        exitFullScreen()
        notifyError({ key: 'mapWorkspace.upload.error', params: { details } })
      }
    },
    [addOverlay, map, notifyError, notifyWarning]
  )
}
