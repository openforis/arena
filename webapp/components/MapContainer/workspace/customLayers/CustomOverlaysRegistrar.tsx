import { useEffect, useRef } from 'react'

import { createCustomLeafletLayer } from '@webapp/components/MapContainer/workspace/customLayers/createCustomLeafletLayer'
import {
  diffOverlayIds,
  toCustomOverlayId,
} from '@webapp/components/MapContainer/workspace/customLayers/customLayerLeaflet'
import { useMapCustomLayers } from '@webapp/components/MapContainer/workspace/customLayers/MapCustomLayersContext'
import { useMapCustomOverlays } from '@webapp/components/MapContainer/workspace/layers/MapCustomOverlaysContext'

import { setGridLayerOpacity } from '@webapp/components/MapContainer/workspace/layers/customOverlays'
/**
 * Keeps the overlay registry (Layers tab, group "Custom (WMS / WMTS)") in sync with the stored custom overlays.
 * Removing a row in the Layers tab deletes the stored layer.
 * @returns {null} Nothing is rendered.
 */
export const CustomOverlaysRegistrar = (): null => {
  const { overlays, removeLayer } = useMapCustomLayers()
  const { addOverlay, removeOverlay } = useMapCustomOverlays()
  const registeredIdsRef = useRef(new Set<string>())
  // read when a row is removed, so the permission and survey are the current ones, not those of the registration
  const removeLayerRef = useRef(removeLayer)
  useEffect(() => {
    removeLayerRef.current = removeLayer
  }, [removeLayer])

  useEffect(() => {
    const registeredIds = registeredIdsRef.current
    const overlayById = new Map(overlays.map((layer) => [toCustomOverlayId(layer.id), layer]))
    const { toAdd, toRemove } = diffOverlayIds({ registeredIds, wantedIds: [...overlayById.keys()] })
    for (const id of toRemove) {
      // deleted first, so onRemove knows the removal does not come from the Layers tab
      registeredIds.delete(id)
      removeOverlay(id)
    }
    for (const id of toAdd) {
      const layer = overlayById.get(id)
      if (!layer) continue
      registeredIds.add(id)
      addOverlay({
        id,
        group: 'custom',
        name: layer.name,
        layer: createCustomLeafletLayer(layer),
        opacity: layer.opacity,
        attribution: layer.attribution,
        setOpacity: setGridLayerOpacity,
        onRemove: () => {
          if (!registeredIds.delete(id)) return
          void removeLayerRef.current(layer)
        },
      })
    }
  }, [addOverlay, overlays, removeOverlay])

  // unregisters everything only on unmount, whatever the identity of removeOverlay
  const removeOverlayRef = useRef(removeOverlay)
  useEffect(() => {
    removeOverlayRef.current = removeOverlay
  }, [removeOverlay])

  useEffect(() => {
    const registeredIds = registeredIdsRef.current
    return () => {
      const ids = [...registeredIds]
      registeredIds.clear()
      for (const id of ids) removeOverlayRef.current(id)
    }
  }, [])

  return null
}
