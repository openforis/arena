import {
  MAX_CAPABILITIES_LAYERS,
  type MapServiceCapabilities,
  type MapServiceLayer,
  toMapImageFormats,
} from '@core/map/customLayers/mapServiceCapabilities'
import { resolveServiceHref } from '@server/modules/geo/service/mapCapabilities/capabilitiesUrl'
import {
  attributeOf,
  childElements,
  childText,
  findPath,
  firstChild,
  textOf,
  type XmlElement,
} from '@server/modules/geo/service/mapCapabilities/xmlElements'

export const WMS_ROOT_NAMES = ['WMS_Capabilities', 'WMT_MS_Capabilities'] // 1.3.0, 1.1.x

const WEB_MERCATOR_CODES = new Set(['EPSG:3857', 'EPSG:900913'])
// parameters Leaflet sets on every GetMap request
const GET_MAP_PARAM_KEYS = new Set([
  'service',
  'request',
  'version',
  'layers',
  'styles',
  'format',
  'transparent',
  'crs',
  'srs',
  'bbox',
  'width',
  'height',
  'exceptions',
  'bgcolor',
])

// a boolean, not the CRS list: copying the list per depth is quadratic on deeply nested documents
type InheritedLayerProps = { webMercator: boolean; attribution: string }
type PendingLayer = { element: XmlElement; inherited: InheritedLayerProps }

/**
 * Tells whether a layer itself declares a Web Mercator coordinate system (CRS in 1.3.0, SRS in 1.1.x, possibly space
 * separated).
 * @param {XmlElement} layer - The Layer element.
 * @returns {boolean} True when EPSG:3857 or EPSG:900913 is declared.
 */
const declaresWebMercator = (layer: XmlElement): boolean => {
  for (const element of [...childElements(layer, 'CRS'), ...childElements(layer, 'SRS')]) {
    for (const code of textOf(element).split(/\s+/)) {
      if (WEB_MERCATOR_CODES.has(code.toUpperCase())) return true
    }
  }
  return false
}

/**
 * Reads a Layer element; CRS and attribution are inherited from the parent layers.
 * @param {PendingLayer} pending - The element and what it inherits.
 * @returns {{layer: MapServiceLayer|null, inherited: InheritedLayerProps}} The layer (null without Name: it cannot be
 * requested) and what its children inherit.
 */
const readLayer = ({
  element,
  inherited,
}: PendingLayer): { layer: MapServiceLayer | null; inherited: InheritedLayerProps } => {
  const webMercator = inherited.webMercator || declaresWebMercator(element)
  const attribution = childText(firstChild(element, 'Attribution'), 'Title') || inherited.attribution
  const nextInherited = { webMercator, attribution }
  const name = childText(element, 'Name')
  if (!name) return { layer: null, inherited: nextInherited }
  const layer = {
    name,
    title: childText(element, 'Title') || name,
    webMercator,
    attribution,
  }
  return { layer, inherited: nextInherited }
}

/**
 * Collects the named layers of the layer tree in document order, without recursion (documents can nest deeply).
 * @param {XmlElement|undefined} capability - The Capability element.
 * @returns {{layers: MapServiceLayer[], truncated: boolean}} The layers (at most 500) and whether some were left out.
 */
export const collectWmsLayers = (
  capability: XmlElement | undefined
): { layers: MapServiceLayer[]; truncated: boolean } => {
  const layers: MapServiceLayer[] = []
  const stack: PendingLayer[] = childElements(capability, 'Layer')
    .reverse()
    .map((element) => ({ element, inherited: { webMercator: false, attribution: '' } }))
  while (stack.length > 0) {
    const pending = stack.pop() as PendingLayer
    const { layer, inherited } = readLayer(pending)
    if (layer) {
      if (layers.length >= MAX_CAPABILITIES_LAYERS) return { layers, truncated: true }
      layers.push(layer)
    }
    const children = childElements(pending.element, 'Layer')
    for (let index = children.length - 1; index >= 0; index -= 1) {
      stack.push({ element: children[index], inherited })
    }
  }
  return { layers, truncated: false }
}

/**
 * Removes the GetMap parameters Leaflet sets itself (vendor parameters such as "map" stay).
 * @param {string} url - The URL.
 * @returns {string} The URL without those parameters.
 */
const stripGetMapParams = (url: string): string => {
  const result = new URL(url)
  for (const key of [...result.searchParams.keys()]) {
    if (GET_MAP_PARAM_KEYS.has(key.toLowerCase())) result.searchParams.delete(key)
  }
  if ([...result.searchParams.keys()].length === 0) result.search = ''
  return result.toString()
}

/**
 * Reads the GetMap endpoint; falls back to the capabilities request URL.
 * @param {XmlElement|undefined} capability - The Capability element.
 * @param {string} requestUrl - The capabilities request URL.
 * @returns {string} The endpoint without GetMap parameters.
 */
export const readWmsGetMapUrl = (capability: XmlElement | undefined, requestUrl: string): string => {
  const onlineResource = findPath(capability, ['Request', 'GetMap', 'DCPType', 'HTTP', 'Get', 'OnlineResource'])
  const href = attributeOf(onlineResource, 'href')
  const endpoint = (href && resolveServiceHref(href, requestUrl)) || requestUrl
  return stripGetMapParams(endpoint)
}

/**
 * Parses a WMS GetCapabilities document (1.1.x or 1.3.0).
 * @param {object} params - Parameters.
 * @param {XmlElement} params.root - The WMS_Capabilities or WMT_MS_Capabilities element.
 * @param {string} params.requestUrl - The capabilities request URL.
 * @returns {MapServiceCapabilities} The summary.
 */
export const parseWmsCapabilities = ({
  root,
  requestUrl,
}: {
  root: XmlElement
  requestUrl: string
}): MapServiceCapabilities => {
  const capability = firstChild(root, 'Capability')
  const { layers, truncated } = collectWmsLayers(capability)
  const formats = toMapImageFormats(childElements(findPath(capability, ['Request', 'GetMap']), 'Format').map(textOf))
  return {
    kind: 'wms',
    // Leaflet speaks 1.1.1 (SRS) or 1.3.0 (CRS)
    version: (attributeOf(root, 'version') ?? '').startsWith('1.3') ? '1.3.0' : '1.1.1',
    title: childText(firstChild(root, 'Service'), 'Title'),
    url: readWmsGetMapUrl(capability, requestUrl),
    formats: formats.length > 0 ? formats : ['image/png'],
    webMercator: layers.some((layer) => layer.webMercator),
    layers,
    truncated,
  }
}
