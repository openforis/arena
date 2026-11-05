import type { MapCustomLayer, MapCustomLayerWithScope } from '@core/map/customLayers/mapCustomLayer'
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '@webapp/components/MapContainer/mapZoom'

// above the built-in overlays (Leaflet's default 1) and below the markers pane
export const CUSTOM_OVERLAY_Z_INDEX = 100
export const CUSTOM_BASE_LAYER_KEY_PREFIX = 'custom:'
export const CUSTOM_OVERLAY_ID_PREFIX = 'custom-'

export type CustomLayerTileOptions = {
  opacity: number
  attribution: string
  minZoom: number
  maxZoom: number
  maxNativeZoom?: number
  zIndex?: number
}

export type CustomLayerWmsParams = {
  layers: string
  styles: string
  format: string
  transparent: boolean
  version: string
}

export type CustomLayerLeafletConfig =
  | { type: 'wms'; url: string; params: CustomLayerWmsParams; options: CustomLayerTileOptions }
  | { type: 'tile'; url: string; options: CustomLayerTileOptions }

// what MapContext stores as the selected base layer when it is a custom one ("name" is what Leaflet's control sees)
export type CustomBaseLayerDef = {
  key: string
  name: string
  label: string
  attribution: string
  custom: MapCustomLayerWithScope
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/**
 * Escapes an attribution: Leaflet's attribution control renders HTML, and attributions are typed by users or read
 * from remote capabilities documents.
 * @param {string} text - The plain-text attribution.
 * @returns {string} The HTML-escaped text.
 */
export const escapeAttribution = (text: string): string => text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])

/**
 * Builds the Leaflet options of a custom layer.
 * @param {MapCustomLayer} layer - The layer.
 * @returns {CustomLayerTileOptions} The options.
 */
const buildTileOptions = (layer: MapCustomLayer): CustomLayerTileOptions => ({
  opacity: layer.opacity,
  attribution: escapeAttribution(layer.attribution),
  minZoom: MAP_MIN_ZOOM,
  maxZoom: MAP_MAX_ZOOM,
  ...(layer.role === 'overlay' ? { zIndex: CUSTOM_OVERLAY_Z_INDEX } : {}),
})

/**
 * Tells how to create the Leaflet layer of a custom layer.
 * @param {MapCustomLayer} layer - The layer.
 * @returns {CustomLayerLeafletConfig} WMS: the GetMap endpoint and its parameters; WMTS and XYZ: the tile template.
 */
export const getCustomLayerLeafletConfig = (layer: MapCustomLayer): CustomLayerLeafletConfig => {
  const options = buildTileOptions(layer)
  if (layer.kind === 'wms') {
    const params = {
      layers: layer.wmsLayers ?? '',
      styles: '',
      format: layer.format,
      transparent: layer.format === 'image/png',
      version: layer.wmsVersion ?? '1.3.0',
    }
    return { type: 'wms', url: layer.url, params, options }
  }
  // past the deepest zoom of the service, Leaflet scales up its last tiles instead of requesting missing ones
  const maxNativeZoom = layer.maxZoom === undefined ? {} : { maxNativeZoom: Math.min(layer.maxZoom, MAP_MAX_ZOOM) }
  return { type: 'tile', url: layer.url, options: { ...options, ...maxNativeZoom } }
}

/**
 * Builds the base layer definition of a custom base map.
 * @param {MapCustomLayerWithScope} layer - The layer (role baseMap).
 * @returns {CustomBaseLayerDef} The definition.
 */
export const toCustomBaseLayerDef = (layer: MapCustomLayerWithScope): CustomBaseLayerDef => {
  const key = `${CUSTOM_BASE_LAYER_KEY_PREFIX}${layer.id}`
  // the key doubles as the Leaflet control name, so a custom name equal to a built-in one cannot select both
  return { key, name: key, label: layer.name, attribution: layer.attribution, custom: layer }
}

/**
 * Tells whether a base layer key or name is a custom base map.
 * @param {unknown} value - The key or name.
 * @returns {boolean} True for custom base maps.
 */
export const isCustomBaseLayerKey = (value: unknown): boolean =>
  typeof value === 'string' && value.startsWith(CUSTOM_BASE_LAYER_KEY_PREFIX)

/**
 * Finds the custom base map Leaflet's layers control switched to.
 * @param {object} params - Parameters.
 * @param {string} params.controlName - The name in the baselayerchange event.
 * @param {CustomBaseLayerDef[]} params.customBaseLayerDefs - The custom base maps.
 * @returns {CustomBaseLayerDef|null} The definition, or null when the name is not a custom base map.
 */
export const findCustomBaseLayerDef = ({
  controlName,
  customBaseLayerDefs,
}: {
  controlName: string
  customBaseLayerDefs: CustomBaseLayerDef[]
}): CustomBaseLayerDef | null => {
  if (!isCustomBaseLayerKey(controlName)) return null
  return customBaseLayerDefs.find((def) => def.name === controlName) ?? null
}

/**
 * Builds the overlay registry id of a custom overlay.
 * @param {string} layerId - The custom layer id.
 * @returns {string} The registry id.
 */
export const toCustomOverlayId = (layerId: string): string => `${CUSTOM_OVERLAY_ID_PREFIX}${layerId}`

/**
 * Compares the registered overlays with the wanted ones.
 * @param {object} params - Parameters.
 * @param {Iterable<string>} params.registeredIds - The ids registered now.
 * @param {string[]} params.wantedIds - The ids that should be registered.
 * @returns {{toAdd: string[], toRemove: string[]}} What to register and unregister.
 */
export const diffOverlayIds = ({
  registeredIds,
  wantedIds,
}: {
  registeredIds: Iterable<string>
  wantedIds: string[]
}): { toAdd: string[]; toRemove: string[] } => {
  const registered = new Set(registeredIds)
  const wanted = new Set(wantedIds)
  return {
    toAdd: wantedIds.filter((id) => !registered.has(id)),
    toRemove: [...registered].filter((id) => !wanted.has(id)),
  }
}
