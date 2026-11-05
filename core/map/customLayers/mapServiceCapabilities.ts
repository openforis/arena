import { type MapImageFormat, mapImageFormats } from '@core/map/customLayers/mapCustomLayer'

export type MapServiceKind = 'wms' | 'wmts'

// one layer offered by a service, as listed in the WMS dialog
export type MapServiceLayer = {
  name: string // WMS layer name or WMTS layer identifier
  title: string
  webMercator: boolean // false: Leaflet cannot show it (no EPSG:3857 / GoogleMapsCompatible tiles)
  attribution: string
  tileUrlTemplates?: Partial<Record<MapImageFormat, string>> // WMTS only, by image format
  maxZoom?: number // WMTS only
}

// what the capabilities route returns (never the raw XML)
export type MapServiceCapabilities = {
  kind: MapServiceKind
  version: string
  title: string
  url: string // WMS: GetMap endpoint without OGC parameters; WMTS: the capabilities request
  formats: MapImageFormat[]
  webMercator: boolean // at least one layer can be shown
  layers: MapServiceLayer[]
  truncated: boolean // more than MAX_CAPABILITIES_LAYERS layers
}

export const MAX_CAPABILITIES_LAYERS = 500

/**
 * Maps a MIME type offered by a service to an image format Arena supports.
 * @param {string} mimeType - The MIME type, e.g. "image/png; mode=8bit".
 * @returns {MapImageFormat|null} image/png, image/jpeg, or null for other types.
 */
export const toMapImageFormat = (mimeType: string): MapImageFormat | null => {
  const value = mimeType.toLowerCase()
  if (value.includes('png')) return 'image/png'
  if (value.includes('jpeg') || value.includes('jpg')) return 'image/jpeg'
  return null
}

/**
 * Lists the supported image formats among the MIME types offered by a service.
 * @param {string[]} mimeTypes - The MIME types.
 * @returns {MapImageFormat[]} The formats, PNG first, without duplicates.
 */
export const toMapImageFormats = (mimeTypes: string[]): MapImageFormat[] => {
  const found = new Set(mimeTypes.map(toMapImageFormat))
  return mapImageFormats.filter((format) => found.has(format))
}
