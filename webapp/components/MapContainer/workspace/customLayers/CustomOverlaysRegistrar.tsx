import type L from 'leaflet'
import { useEffect, useRef } from 'react'

import { createCustomLeafletLayer } from '@webapp/components/MapContainer/workspace/customLayers/createCustomLeafletLayer'
import {
  diffOverlayIds,
  toCustomOverlayId,
} from '@webapp/components/MapContainer/workspace/customLayers/customLayerLeaflet'
import { useMapCustomLayers } from '@webapp/components/MapContainer/workspace/customLayers/MapCustomLayersContext'
import { useMapCustomOverlays } from '@webapp/components/MapContainer/workspace/layers/MapCustomOverlaysContext'

/**
 * Applies an opacity to a custom overlay.
 * @param {L.Layer} layer - The tile layer.
 * @param {number} opacity - The opacity.
 * @returns {void}
 */
const setTileLayerOpacity = (layer: L.Layer, opacity: number): void => {
  ;(layer as L.TileLayer).setOpacity(opacity)
}

/**
 * Keeps the overlay registry (Layers tab, group "Custom (WMS / WMTS)") in sync with the stored custom overlays.
 * Removing a row in the Layers tab deletes the stored layer.
 * @returns {null} Nothing is rendered.
 */
export const CustomOverlaysRegistrar = (): null => {
  const { overlays, removeLayer } = useMapCustomLayers()
  const { addOverlay, removeOverlay } = useMapCustomOverlays()
  const registeredIdsRef = useRef(new Set<string>())

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
        setOpacity: setTileLayerOpacity,
        onRemove: () => {
          if (!registeredIds.delete(id)) return
          void removeLayer(layer)
        },
      })
    }
  }, [addOverlay, overlays, removeLayer, removeOverlay])

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
