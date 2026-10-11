// Type-only import: erased at build time, so unit tests do not load Leaflet.
import type { GridLayer, Layer } from 'leaflet'

import type { GeoBounds, SceneBandMix } from './sceneTypes'

const BASE_PREFIX = 's2:base:'
const LAYER_PREFIX = 's2:layer:'
const PLOT_HALF_SIZE_DEGREES = 0.01

/**
 * Builds the overlay registry id of a scene layer.
 *
 * @param {string} sceneId - Scene id.
 * @param {SceneBandMix} bandMix - Band mix.
 * @param {boolean} asBase - True when used as base map.
 * @returns {string} Overlay id.
 */
export const getSceneOverlayId = (sceneId: string, bandMix: SceneBandMix, asBase: boolean): string =>
  `${asBase ? BASE_PREFIX : LAYER_PREFIX}${bandMix}:${sceneId}`

/**
 * Tells whether an overlay id is a scene used as base map.
 *
 * @param {string} id - Overlay id.
 * @returns {boolean} True for a base scene.
 */
export const isBaseSceneOverlayId = (id: string): boolean => id.startsWith(BASE_PREFIX)

/**
 * Returns the attribution required by the Copernicus licence (kept in English, it is the licence wording).
 *
 * @param {string} datetime - Scene ISO datetime.
 * @returns {string} Attribution.
 */
export const getSceneAttribution = (datetime: string): string =>
  `Contains modified Copernicus Sentinel data ${datetime.slice(0, 4)}`

/**
 * Builds a small box around a point (the last opened map popup: record, sampling point or uploaded feature).
 *
 * @param {number} lat - Latitude.
 * @param {number} lng - Longitude.
 * @param {number} [halfSizeDegrees] - Half size of the box in degrees.
 * @returns {GeoBounds} Box.
 */
export const boundsAroundPoint = (lat: number, lng: number, halfSizeDegrees = PLOT_HALF_SIZE_DEGREES): GeoBounds => ({
  west: lng - halfSizeDegrees,
  south: lat - halfSizeDegrees,
  east: lng + halfSizeDegrees,
  north: lat + halfSizeDegrees,
})

/**
 * Removes the scenes currently used as base map (only one base scene at a time).
 *
 * @param {Array<{id: string}>} overlays - Registered overlays.
 * @param {(id: string) => void} removeOverlay - Registry remove function.
 * @returns {void}
 */
export const removeBaseSceneOverlays = (overlays: Array<{ id: string }>, removeOverlay: (id: string) => void): void => {
  for (const overlay of overlays) {
    if (isBaseSceneOverlayId(overlay.id)) removeOverlay(overlay.id)
  }
}

/**
 * Applies opacity to a scene layer (a Leaflet GridLayer).
 *
 * @param {Layer} layer - Scene layer.
 * @param {number} opacity - Opacity 0.05–1.
 * @returns {void}
 */
export const setSceneLayerOpacity = (layer: Layer, opacity: number): void => {
  const gridLayer = layer as GridLayer
  gridLayer.setOpacity(opacity)
}
