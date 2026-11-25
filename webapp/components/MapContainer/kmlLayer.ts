import { kml } from '@tmcw/togeojson'
import type { Feature, Geometry, Point } from 'geojson'
import L from 'leaflet'

import { buildKmlPopupHtml } from './kmlPopupContent'

// properties of a KML feature converted by togeojson (simplestyle names for the KML styles)
type KmlFeatureProperties = {
  name?: string
  description?: string | { '@type': string; value: string }
  icon?: string
  stroke?: string
  'stroke-opacity'?: number
  'stroke-width'?: number
  fill?: string
  'fill-opacity'?: number
  '@geometry-type'?: string
}

type KmlFeature = Feature<Geometry | null, KmlFeatureProperties>

const iconSize = 32

// image of a ground overlay, rotated by the angle (degrees, counterclockwise like KML) of its LatLonBox
class RotatedImageOverlay extends L.ImageOverlay {
  private readonly angle: number

  constructor(imageUrl: string, bounds: L.LatLngBoundsExpression, options: L.ImageOverlayOptions & { angle: number }) {
    super(imageUrl, bounds, options)
    this.angle = options.angle
  }

  // Leaflet sets the position of the image (a CSS transform) on reset and zoom: the rotation is added after it
  _reset(): void {
    // @ts-expect-error _reset is internal to Leaflet
    super._reset()
    this.rotate()
  }

  _animateZoom(event: L.ZoomAnimEvent): void {
    // @ts-expect-error _animateZoom is internal to Leaflet
    super._animateZoom(event)
    this.rotate()
  }

  private rotate(): void {
    const image = this.getElement()
    if (image && this.angle) image.style.transform += ` rotate(${-this.angle}deg)`
  }
}

/**
 * Returns the text of a KML description: togeojson gives the HTML ones as an object.
 * @returns {string} The text (HTML).
 */
const getDescriptionText = (description: KmlFeatureProperties['description']): string => {
  if (!description) return ''
  return typeof description === 'string' ? description : description.value
}

/**
 * Binds the popup of a KML place: its name and description (sanitized, the KML comes from the user).
 */
const bindPlacePopup = (feature: KmlFeature, layer: L.Layer): void => {
  const { name, description } = feature.properties ?? {}
  if (!name) return
  layer.bindPopup(buildKmlPopupHtml(name, getDescriptionText(description)), { className: 'kml-popup' })
}

/**
 * Converts the KML styles of a feature (line and polygon colors, widths, opacities) into Leaflet path options.
 * @returns {L.PathOptions} The path options.
 */
const toPathOptions = (feature?: KmlFeature): L.PathOptions => {
  const properties = feature?.properties ?? {}
  const options: L.PathOptions = {}
  if (properties.stroke) options.color = properties.stroke
  if (properties['stroke-opacity'] !== undefined) options.opacity = properties['stroke-opacity']
  if (properties['stroke-width'] !== undefined) options.weight = properties['stroke-width']
  if (properties.fill) options.fillColor = properties.fill
  if (properties['fill-opacity'] !== undefined) options.fillOpacity = properties['fill-opacity']
  return options
}

/**
 * Creates the marker of a KML point: with the icon of its style, or the default one.
 * @param {L.LatLng} latLng - Its position.
 * @returns {L.Marker} The marker.
 */
const toMarker = (feature: KmlFeature, latLng: L.LatLng): L.Marker => {
  const iconUrl = feature.properties?.icon
  if (!iconUrl) return L.marker(latLng)
  const icon = L.icon({
    iconUrl,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2],
  })
  return L.marker(latLng, { icon })
}

/**
 * Reads the rotation of the ground overlays (togeojson leaves it out), in document order.
 * @param {Document} xml - The KML document.
 * @returns {number[]} The rotation of each ground overlay, in degrees (0 when not specified).
 */
const readGroundOverlayRotations = (xml: Document): number[] =>
  Array.from(xml.getElementsByTagName('GroundOverlay')).map((groundOverlay) => {
    const rotation = groundOverlay.getElementsByTagName('rotation')[0]?.textContent
    return rotation ? Number.parseFloat(rotation) || 0 : 0
  })

/**
 * Creates the layer of a ground overlay: its image in its (unrotated) LatLonBox, then rotated.
 * @param {KmlFeature} feature - The ground overlay feature (with the image URL and the box as bbox).
 * @param {number} angle - The rotation in degrees.
 * @returns {L.ImageOverlay|null} The layer, or null without image or box.
 */
const toGroundOverlay = (feature: KmlFeature, angle: number): L.ImageOverlay | null => {
  const iconUrl = feature.properties?.icon
  const [west, south, east, north] = feature.bbox ?? []
  if (!iconUrl || north === undefined) return null
  const bounds = L.latLngBounds([south, west], [north, east])
  return new RotatedImageOverlay(iconUrl, bounds, { angle })
}

const isGroundOverlay = (feature: KmlFeature): boolean => feature.properties?.['@geometry-type'] === 'groundoverlay'

/**
 * Builds the Leaflet layer of a KML document: places (points, lines, polygons) with their style and popup,
 * and ground overlays.
 * @param {Document} xml - The KML document.
 * @returns {L.FeatureGroup} The layer.
 */
export const toKmlLayerFromDocument = (xml: Document): L.FeatureGroup => {
  const features = kml(xml).features as KmlFeature[]
  const rotations = readGroundOverlayRotations(xml)

  const groundOverlays = features
    .filter(isGroundOverlay)
    .map((feature, index) => toGroundOverlay(feature, rotations[index] ?? 0))
    .filter((layer): layer is L.ImageOverlay => layer !== null)

  const places = L.geoJSON(
    {
      type: 'FeatureCollection',
      features: features.filter((feature) => !isGroundOverlay(feature) && feature.geometry !== null),
    } as GeoJSON.FeatureCollection<Geometry, KmlFeatureProperties>,
    {
      style: toPathOptions,
      pointToLayer: (feature: Feature<Point, KmlFeatureProperties>, latLng) => toMarker(feature, latLng),
      onEachFeature: bindPlacePopup,
    }
  )
  return L.featureGroup([places, ...groundOverlays])
}

/**
 * Builds the Leaflet layer of a KML text.
 * @param {string} text - The KML text.
 * @returns {L.FeatureGroup} The layer.
 * @throws {Error} When the text is not valid XML.
 */
export const toKmlLayer = (text: string): L.FeatureGroup => {
  const xml = new DOMParser().parseFromString(text, 'text/xml')
  if (xml.getElementsByTagName('parsererror').length > 0) throw new Error('invalid KML')
  return toKmlLayerFromDocument(xml)
}
