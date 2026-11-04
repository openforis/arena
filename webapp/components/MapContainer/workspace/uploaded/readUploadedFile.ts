import L from 'leaflet'
import shp from 'shpjs'

import { ZipUtils } from '@webapp/utils/zipUtils'

// side effect: defines L.KML
import '../../L.KML'
import type { UploadedFileKind } from './uploadedFiles'

type KmlLayerConstructor = new (kml: Document) => L.FeatureGroup
type ZipEntry = { async: (type: 'string') => Promise<string> }
type GeoJsonInput = Parameters<typeof L.geoJSON>[0]

/**
 * Formats a feature property value as text.
 * @param {unknown} value - The property value.
 * @returns {string} The text (objects as JSON).
 */
const formatPropertyValue = (value: unknown): string =>
  value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value)

/**
 * Binds a popup with the properties of a feature as plain text (the file comes from the user; KML popups are sanitized in L.KML).
 * @param {object} feature - The GeoJSON feature.
 * @param {L.Layer} layer - The layer of the feature.
 * @returns {void}
 */
const bindPropertiesPopup = (feature: { properties?: Record<string, unknown> | null }, layer: L.Layer): void => {
  const entries = Object.entries(feature.properties ?? {})
  if (entries.length === 0) return
  const content = document.createElement('div')
  for (const [key, value] of entries) {
    const line = document.createElement('div')
    line.textContent = `${key}: ${formatPropertyValue(value)}`
    content.appendChild(line)
  }
  layer.bindPopup(content)
}

/**
 * Builds a layer from GeoJSON data.
 * @param {GeoJsonInput} data - The GeoJSON data.
 * @returns {L.GeoJSON} The layer.
 */
const toGeoJsonLayer = (data: GeoJsonInput): L.GeoJSON => L.geoJSON(data, { onEachFeature: bindPropertiesPopup })

/**
 * Builds a layer from KML text.
 * @param {string} text - The KML text.
 * @returns {L.Layer} The layer.
 */
const toKmlLayer = (text: string): L.Layer => {
  const xml = new DOMParser().parseFromString(text, 'text/xml')
  if (xml.getElementsByTagName('parsererror').length > 0) throw new Error('invalid KML')
  const KmlLayer = (L as unknown as { KML: KmlLayerConstructor }).KML
  return new KmlLayer(xml)
}

/**
 * Reads the KML files inside a KMZ file.
 * @param {File} file - The KMZ file.
 * @returns {Promise<string[]>} The text of each KML file.
 */
const readKmzTexts = async (file: File): Promise<string[]> => {
  const texts: string[] = []
  await ZipUtils.forEachFileInZip(file, async (relativePath: string, fileEntry: ZipEntry) => {
    if (relativePath.toLowerCase().endsWith('.kml')) texts.push(await fileEntry.async('string'))
  })
  if (texts.length === 0) throw new Error('no KML file in the KMZ file')
  return texts
}

/**
 * Reads a KML, KMZ, zipped Shapefile or GeoJSON file into Leaflet layers (not added to the map).
 * @param {File} file - The file.
 * @param {UploadedFileKind} kind - Its kind (from its extension).
 * @returns {Promise<L.Layer[]>} One layer per KML document / Shapefile layer, one for a GeoJSON file.
 * @throws {Error} When the file cannot be parsed.
 */
export const readUploadedFile = async (file: File, kind: UploadedFileKind): Promise<L.Layer[]> => {
  switch (kind) {
    case 'kml':
      return [toKmlLayer(await file.text())]
    case 'kmz':
      return (await readKmzTexts(file)).map(toKmlLayer)
    case 'shapefileZip': {
      const data = await shp(await file.arrayBuffer())
      const collections = Array.isArray(data) ? data : [data]
      return collections.map(toGeoJsonLayer)
    }
    case 'geojson':
      return [toGeoJsonLayer(JSON.parse(await file.text()))]
  }
}

/**
 * Applies an opacity to an uploaded layer: markers, lines and polygons (fill at half), ground overlays.
 * @param {L.Layer} layer - The layer (groups are walked).
 * @param {number} opacity - Opacity 0–1.
 * @returns {void}
 */
export const setUploadedLayerOpacity = (layer: L.Layer, opacity: number): void => {
  if (layer instanceof L.LayerGroup) {
    // GeoJSON and KML layers are groups
    layer.eachLayer((child) => setUploadedLayerOpacity(child, opacity))
    return
  }
  if (layer instanceof L.Marker || layer instanceof L.ImageOverlay) {
    layer.setOpacity(opacity)
    return
  }
  if (layer instanceof L.Path) layer.setStyle({ opacity, fillOpacity: opacity / 2 })
}
