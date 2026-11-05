import { useCallback } from 'react'

import { defaultBaseLayer } from '@webapp/components/MapContainer/baseLayers'
import { useMapContextBaseLayer } from '@webapp/components/MapContainer/MapContext'
import type { CustomBaseLayerDef } from '@webapp/components/MapContainer/workspace/customLayers/customLayerLeaflet'
import { useMapContextActions } from '@webapp/components/MapContainer/workspace/mapContextActions'

/**
 * Reads and changes the selected base layer of the map context (null selects the default base layer).
 * @returns {{selectedBaseLayerKey: string|null, selectBaseLayer: Function}} The selected key and the setter.
 */
export const useMapBaseLayerApi = (): {
  selectedBaseLayerKey: string | null
  selectBaseLayer: (def: CustomBaseLayerDef | null) => void
} => {
  // MapContext.js is untyped: the selected base layer is the stored one, else the default one
  const selectedBaseLayer = useMapContextBaseLayer() as { key?: string } | null | undefined
  const { onBaseLayerUpdate } = useMapContextActions()
  const selectedBaseLayerKey = selectedBaseLayer?.key ?? null
  const selectBaseLayer = useCallback(
    (def: CustomBaseLayerDef | null) => onBaseLayerUpdate(def ?? (defaultBaseLayer as object)),
    [onBaseLayerUpdate]
  )
  return { selectedBaseLayerKey, selectBaseLayer }
}
