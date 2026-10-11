import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactElement, ReactNode } from 'react'

import { useMapWorkspace } from '../MapWorkspaceContext'
import { clampOpacity } from './customOverlays'
import type { MapCustomOverlay, MapCustomOverlayGroup } from './customOverlays'

export type { MapCustomOverlay, MapCustomOverlayGroup }

export type MapCustomOverlayInput = Omit<MapCustomOverlay, 'visible'> & { visible?: boolean }

export type MapCustomOverlaysContextValue = {
  overlays: MapCustomOverlay[]
  addOverlay: (overlay: MapCustomOverlayInput) => void
  updateOverlay: (id: string, changes: { visible?: boolean; opacity?: number; name?: string }) => void
  removeOverlay: (id: string) => void
}

const MapCustomOverlaysContext = createContext<MapCustomOverlaysContextValue | null>(null)

/**
 * Keeps the layers that are not survey data (uploaded files, WMS layers, Sentinel-2 scenes) and syncs them with the map.
 * @param {object} props - Component props.
 * @param {ReactNode} props.children - Workspace content.
 * @returns {React.ReactElement} The provider.
 */
export const MapCustomOverlaysProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const { map } = useMapWorkspace()
  const [overlays, setOverlays] = useState<MapCustomOverlay[]>([])
  const overlaysRef = useRef(overlays)
  // the callbacks and the unmount cleanup read the latest overlays
  useLayoutEffect(() => {
    overlaysRef.current = overlays
  }, [overlays])

  // visibility follows the state: add visible layers, remove hidden ones
  useEffect(() => {
    if (!map) return
    for (const { layer, visible } of overlays) {
      if (visible && !map.hasLayer(layer)) map.addLayer(layer)
      if (!visible && map.hasLayer(layer)) map.removeLayer(layer)
    }
  }, [map, overlays])

  // the layers leave the map with the workspace
  useEffect(
    () => () => {
      for (const { layer } of overlaysRef.current) layer.remove()
    },
    []
  )

  /**
   * Adds an overlay, replacing the one with the same id.
   * @param {MapCustomOverlayInput} input - The overlay.
   * @returns {void}
   */
  const addOverlay = useCallback((input: MapCustomOverlayInput) => {
    const overlay: MapCustomOverlay = { ...input, visible: input.visible ?? true, opacity: clampOpacity(input.opacity) }
    overlay.setOpacity(overlay.layer, overlay.opacity)
    setOverlays((previous) => {
      const replaced = previous.find((item) => item.id === overlay.id)
      if (replaced && replaced.layer !== overlay.layer) replaced.layer.remove()
      return replaced ? previous.map((item) => (item.id === overlay.id ? overlay : item)) : [...previous, overlay]
    })
  }, [])

  /**
   * Changes the visibility, opacity or name of an overlay (undefined values are ignored).
   * @param {string} id - The overlay id.
   * @param {object} changes - The changes.
   * @returns {void}
   */
  const updateOverlay = useCallback(
    (id: string, changes: { visible?: boolean; opacity?: number; name?: string }) =>
      setOverlays((previous) =>
        previous.map((item) => {
          if (item.id !== id) return item
          const defined = Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined))
          const next = { ...item, ...defined }
          if (changes.opacity !== undefined) {
            next.opacity = clampOpacity(changes.opacity)
            next.setOpacity(next.layer, next.opacity)
          }
          return next
        })
      ),
    []
  )

  /**
   * Removes an overlay from the map and the list.
   * @param {string} id - The overlay id.
   * @returns {void}
   */
  const removeOverlay = useCallback((id: string) => {
    const overlay = overlaysRef.current.find((item) => item.id === id)
    if (!overlay) return
    overlay.layer.remove()
    overlay.onRemove?.()
    setOverlays((previous) => previous.filter((item) => item.id !== id))
  }, [])

  const value = useMemo(
    () => ({ overlays, addOverlay, updateOverlay, removeOverlay }),
    [addOverlay, overlays, removeOverlay, updateOverlay]
  )

  return <MapCustomOverlaysContext.Provider value={value}>{children}</MapCustomOverlaysContext.Provider>
}

/**
 * Returns the overlay registry.
 * @returns {MapCustomOverlaysContextValue} Overlays and the functions that change them.
 */
export const useMapCustomOverlays = (): MapCustomOverlaysContextValue => {
  const context = useContext(MapCustomOverlaysContext)
  if (!context) throw new Error('useMapCustomOverlays must be used inside MapCustomOverlaysProvider')
  return context
}
