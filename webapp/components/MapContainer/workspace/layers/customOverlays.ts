import type { GridLayer, Layer } from 'leaflet'

export type MapCustomOverlayGroup = 'uploaded' | 'custom' | 'scenes'

export type MapCustomOverlay = {
  id: string
  group: MapCustomOverlayGroup
  name: string
  layer: Layer
  visible: boolean
  opacity: number
  attribution?: string
  setOpacity: (layer: Layer, opacity: number) => void
  onRemove?: () => void
}

// order of the groups in the Layers tab
export const MAP_CUSTOM_OVERLAY_GROUPS: MapCustomOverlayGroup[] = ['custom', 'scenes', 'uploaded']

export const MIN_OVERLAY_OPACITY = 0.05

/**
 * Applies an opacity to a tile or scene layer (both are Leaflet GridLayers).
 * @param {Layer} layer - The grid layer.
 * @param {number} opacity - The opacity.
 * @returns {void}
 */
export const setGridLayerOpacity = (layer: Layer, opacity: number): void => {
  ;(layer as GridLayer).setOpacity(opacity)
}

/**
 * Keeps an opacity between 0.05 (never fully invisible: use "show" for that) and 1.
 * @param {number} value - Requested opacity.
 * @returns {number} The clamped opacity; 1 for NaN.
 */
export const clampOpacity = (value: number): number => {
  if (Number.isNaN(value)) return 1
  return Math.min(1, Math.max(MIN_OVERLAY_OPACITY, value))
}

/**
 * Groups overlays in the Layers tab order (custom, scenes, uploaded), dropping empty groups.
 * @param {Array<{group: MapCustomOverlayGroup}>} overlays - Registered overlays, in registration order.
 * @returns {Array<{group: MapCustomOverlayGroup, overlays: Array}>} The non-empty groups.
 */
export const groupOverlays = <T extends { group: MapCustomOverlayGroup }>(
  overlays: T[]
): Array<{ group: MapCustomOverlayGroup; overlays: T[] }> =>
  MAP_CUSTOM_OVERLAY_GROUPS.map((group) => ({
    group,
    overlays: overlays.filter((overlay) => overlay.group === group),
  })).filter((entry) => entry.overlays.length > 0)
