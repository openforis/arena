import { type MapImageFormat, isTileTemplateUrl, mapImageFormats } from '@core/map/customLayers/mapCustomLayer'
import {
  MAX_CAPABILITIES_LAYERS,
  type MapServiceCapabilities,
  type MapServiceLayer,
  toMapImageFormat,
} from '@core/map/customLayers/mapServiceCapabilities'
import { resolveServiceHref } from '@server/modules/geo/service/mapCapabilities/capabilitiesUrl'
import {
  attributeOf,
  childElements,
  childText,
  findAllPath,
  findPath,
  firstChild,
  textOf,
  type XmlElement,
} from '@server/modules/geo/service/mapCapabilities/xmlElements'

// scale denominator of zoom level 0 in the OGC GoogleMapsCompatible well-known scale set
const WEB_MERCATOR_ZOOM_0_SCALE = 559082264.0287178
const WEB_MERCATOR_CRS_PATTERN = /(?:^|\D)(3857|900913|102100|102113|3785)$/
const GOOGLE_MAPS_SCALE_SET_PATTERN = /GoogleMapsCompatible/i
const MAX_TILE_ZOOM = 24

// a tile matrix set Leaflet can show: Web Mercator, identifiers "<prefix>0", "<prefix>1"...
type WebMercatorMatrixSet = { prefix: string; maxZoom: number }
type WmtsLayerContext = {
  matrixSets: Map<string, WebMercatorMatrixSet>
  kvpHref: string | null
  defaultAttribution: string
}

/**
 * Finds the common identifier prefix of the matrices ("EPSG:3857:0", "EPSG:3857:1" → "EPSG:3857:").
 * @param {string[]} identifiers - The TileMatrix identifiers, zoom 0 first.
 * @returns {string|null} The prefix, or null when the identifiers are not "<prefix><zoom>".
 */
const findZoomPrefix = (identifiers: string[]): string | null => {
  if (identifiers.length === 0 || !identifiers[0].endsWith('0')) return null
  const prefix = identifiers[0].slice(0, -1)
  for (const [index, identifier] of identifiers.entries()) {
    if (identifier !== `${prefix}${index}`) return null
  }
  return prefix
}

/**
 * Reads a TileMatrixSet; only Web Mercator sets starting at zoom 0 are usable.
 * @param {XmlElement} matrixSet - The TileMatrixSet element.
 * @returns {WebMercatorMatrixSet|null} The set, or null when Leaflet cannot use it.
 */
const readMatrixSet = (matrixSet: XmlElement): WebMercatorMatrixSet | null => {
  const crs = childText(matrixSet, 'SupportedCRS')
  const scaleSet = childText(matrixSet, 'WellKnownScaleSet')
  if (!WEB_MERCATOR_CRS_PATTERN.test(crs) && !GOOGLE_MAPS_SCALE_SET_PATTERN.test(scaleSet)) return null
  const matrices = childElements(matrixSet, 'TileMatrix')
  if (matrices.length === 0) return null
  const firstScale = Number(childText(matrices[0], 'ScaleDenominator'))
  if (Math.abs(firstScale - WEB_MERCATOR_ZOOM_0_SCALE) / WEB_MERCATOR_ZOOM_0_SCALE > 0.01) return null
  const prefix = findZoomPrefix(matrices.map((matrix) => childText(matrix, 'Identifier')))
  if (prefix === null) return null
  return { prefix, maxZoom: Math.min(matrices.length - 1, MAX_TILE_ZOOM) }
}

/**
 * Reads the usable tile matrix sets of the Contents element.
 * @param {XmlElement} contents - The Contents element.
 * @returns {Map<string, WebMercatorMatrixSet>} The sets by identifier.
 */
const readMatrixSets = (contents: XmlElement): Map<string, WebMercatorMatrixSet> => {
  const matrixSets = new Map<string, WebMercatorMatrixSet>()
  for (const element of childElements(contents, 'TileMatrixSet')) {
    const matrixSet = readMatrixSet(element)
    if (matrixSet) matrixSets.set(childText(element, 'Identifier'), matrixSet)
  }
  return matrixSets
}

/**
 * Tells whether a GetTile Get entry allows KVP requests: no GetEncoding constraint means the default (KVP); a
 * RESTful-only entry does not.
 * @param {XmlElement} get - The Get element.
 * @returns {boolean} True when KVP is allowed.
 */
const allowsKvp = (get: XmlElement): boolean => {
  const constraints = childElements(get, 'Constraint').filter(
    (constraint) => attributeOf(constraint, 'name') === 'GetEncoding'
  )
  if (constraints.length === 0) return true
  return constraints.some((constraint) =>
    childElements(findPath(constraint, ['AllowedValues']), 'Value').some((value) => textOf(value) === 'KVP')
  )
}

/**
 * Reads the KVP GetTile endpoint from OperationsMetadata (a Get with a KVP encoding constraint wins).
 * @param {XmlElement} root - The Capabilities element.
 * @param {string} requestUrl - The capabilities request URL, to resolve relative links.
 * @returns {string|null} The endpoint, or null when there is none.
 */
const readKvpHref = (root: XmlElement, requestUrl: string): string | null => {
  const operation = childElements(firstChild(root, 'OperationsMetadata'), 'Operation').find(
    (element) => attributeOf(element, 'name') === 'GetTile'
  )
  const gets = findAllPath(operation, ['DCP', 'HTTP', 'Get'])
  const get = gets.find(allowsKvp)
  const href = attributeOf(get, 'href')
  return href ? resolveServiceHref(href, requestUrl) : null
}

/**
 * Reads the style a layer is requested with: the default one, else the first, else "default".
 * @param {XmlElement} layer - The Layer element.
 * @returns {string} The style identifier.
 */
const readStyle = (layer: XmlElement): string => {
  const styles = childElements(layer, 'Style')
  const style = styles.find((element) => ['true', '1'].includes(attributeOf(element, 'isDefault') ?? '')) ?? styles[0]
  return childText(style, 'Identifier') || 'default'
}

/**
 * Reads the default values of the layer dimensions (e.g. Time).
 * @param {XmlElement} layer - The Layer element.
 * @returns {Map<string, string>} The values by lower-case dimension identifier.
 */
const readDimensions = (layer: XmlElement): Map<string, string> => {
  const dimensions = new Map<string, string>()
  for (const dimension of childElements(layer, 'Dimension')) {
    const value = childText(dimension, 'Default') || childText(dimension, 'Value')
    // an empty value would leave "//" in a path; the placeholder stays unresolved instead
    if (value) dimensions.set(childText(dimension, 'Identifier').toLowerCase(), value)
  }
  return dimensions
}

/**
 * Fills a REST ResourceURL template with Leaflet placeholders.
 * @param {object} params - Parameters.
 * @param {string} params.template - The ResourceURL template, e.g. ".../{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png".
 * @param {Map<string, string>} params.values - Values by lower-case placeholder name.
 * @returns {string|null} The Leaflet template, or null when a placeholder is unknown.
 */
const fillRestTemplate = ({ template, values }: { template: string; values: Map<string, string> }): string | null => {
  let unresolved = false
  const filled = template.replace(/\{([^{}]+)\}/g, (_match, name: string) => {
    const value = values.get(name.toLowerCase())
    if (value === undefined) unresolved = true
    return value ?? ''
  })
  return unresolved ? null : filled
}

/**
 * Builds the REST tile URL templates of a layer, by image format.
 * @param {object} params - Parameters.
 * @param {XmlElement} params.layer - The Layer element.
 * @param {Map<string, string>} params.values - Placeholder values (matrix set, style, dimensions, zoom/row/col).
 * @param {string} params.requestUrl - The capabilities request URL.
 * @returns {Partial<Record<MapImageFormat, string>>} The templates.
 */
const buildRestTemplates = ({
  layer,
  values,
  requestUrl,
}: {
  layer: XmlElement
  values: Map<string, string>
  requestUrl: string
}): Partial<Record<MapImageFormat, string>> => {
  const templates: Partial<Record<MapImageFormat, string>> = {}
  for (const resource of childElements(layer, 'ResourceURL')) {
    const format = toMapImageFormat(attributeOf(resource, 'format') ?? '')
    const template = attributeOf(resource, 'template') ?? ''
    if (attributeOf(resource, 'resourceType') !== 'tile' || !format || templates[format]) continue
    const filled = fillRestTemplate({ template, values })
    const url = filled ? resolveServiceHref(filled, requestUrl) : null
    // URL resolution percent-encodes braces; put the Leaflet placeholders back
    const leafletUrl = url?.replace(/%7B/gi, '{').replace(/%7D/gi, '}')
    if (leafletUrl && isTileTemplateUrl(leafletUrl)) templates[format] = leafletUrl
  }
  return templates
}

/**
 * Builds the KVP tile URL templates of a layer, by image format.
 * @param {object} params - Parameters.
 * @param {XmlElement} params.layer - The Layer element.
 * @param {string} params.kvpHref - The GetTile endpoint.
 * @param {string} params.style - The style.
 * @param {string} params.matrixSetId - The tile matrix set identifier.
 * @param {string} params.prefix - The TileMatrix identifier prefix.
 * @param {Map<string, string>} params.dimensions - The dimension values.
 * @returns {Partial<Record<MapImageFormat, string>>} The templates.
 */
const buildKvpTemplates = ({
  layer,
  kvpHref,
  style,
  matrixSetId,
  prefix,
  dimensions,
}: {
  layer: XmlElement
  kvpHref: string
  style: string
  matrixSetId: string
  prefix: string
  dimensions: Map<string, string>
}): Partial<Record<MapImageFormat, string>> => {
  const templates: Partial<Record<MapImageFormat, string>> = {}
  // endpoints often end with "?" or "&" already
  let separator = '?'
  if (/[?&]$/.test(kvpHref)) separator = ''
  else if (kvpHref.includes('?')) separator = '&'
  const dimensionParams = [...dimensions.entries()]
    .map(([name, value]) => `&${encodeURIComponent(name.toUpperCase())}=${encodeURIComponent(value)}`)
    .join('')
  for (const mimeType of childElements(layer, 'Format').map(textOf)) {
    const format = toMapImageFormat(mimeType)
    if (!format || templates[format]) continue
    const params = [
      'SERVICE=WMTS',
      'REQUEST=GetTile',
      'VERSION=1.0.0',
      `LAYER=${encodeURIComponent(childText(layer, 'Identifier'))}`,
      `STYLE=${encodeURIComponent(style)}`,
      `TILEMATRIXSET=${encodeURIComponent(matrixSetId)}`,
      `FORMAT=${encodeURIComponent(mimeType)}`,
    ].join('&')
    const zoomParams = `&TILEMATRIX=${encodeURIComponent(prefix)}{z}&TILEROW={y}&TILECOL={x}`
    const template = `${kvpHref}${separator}${params}${dimensionParams}${zoomParams}`
    // a template the model would refuse at save time (e.g. too long) makes the layer not selectable
    if (isTileTemplateUrl(template)) templates[format] = template
  }
  return templates
}

/**
 * Finds the first Web Mercator matrix set a layer is linked to.
 * @param {XmlElement} layer - The Layer element.
 * @param {Map<string, WebMercatorMatrixSet>} matrixSets - The usable sets.
 * @returns {{id: string, matrixSet: WebMercatorMatrixSet}|null} The set, or null when there is none.
 */
const findLayerMatrixSet = (
  layer: XmlElement,
  matrixSets: Map<string, WebMercatorMatrixSet>
): { id: string; matrixSet: WebMercatorMatrixSet } | null => {
  for (const link of childElements(layer, 'TileMatrixSetLink')) {
    const id = childText(link, 'TileMatrixSet')
    const matrixSet = matrixSets.get(id)
    if (matrixSet) return { id, matrixSet }
  }
  return null
}

/**
 * Reads a WMTS Layer element.
 * @param {object} params - Parameters.
 * @param {XmlElement} params.layer - The Layer element.
 * @param {WmtsLayerContext} params.context - Matrix sets, KVP endpoint and default attribution.
 * @param {string} params.requestUrl - The capabilities request URL.
 * @returns {MapServiceLayer} The layer; webMercator is false when no tile URL template could be built.
 */
const readWmtsLayer = ({
  layer,
  context,
  requestUrl,
}: {
  layer: XmlElement
  context: WmtsLayerContext
  requestUrl: string
}): MapServiceLayer => {
  const name = childText(layer, 'Identifier')
  const base = { name, title: childText(layer, 'Title') || name, attribution: context.defaultAttribution }
  const linked = findLayerMatrixSet(layer, context.matrixSets)
  if (!linked) return { ...base, webMercator: false }
  const style = readStyle(layer)
  const dimensions = readDimensions(layer)
  // encoded like the KVP builder does, so a value cannot add path segments, a query or a fragment
  const encodedDimensions = [...dimensions].map(([key, value]): [string, string] => [key, encodeURIComponent(value)])
  const values = new Map<string, string>([
    ...encodedDimensions,
    ['tilematrixset', encodeURIComponent(linked.id)],
    ['style', encodeURIComponent(style)],
    ['tilematrix', `${encodeURIComponent(linked.matrixSet.prefix)}{z}`],
    ['tilerow', '{y}'],
    ['tilecol', '{x}'],
  ])
  let tileUrlTemplates = buildRestTemplates({ layer, values, requestUrl })
  if (Object.keys(tileUrlTemplates).length === 0 && context.kvpHref) {
    const { prefix } = linked.matrixSet
    tileUrlTemplates = buildKvpTemplates({
      layer,
      kvpHref: context.kvpHref,
      style,
      matrixSetId: linked.id,
      prefix,
      dimensions,
    })
  }
  if (Object.keys(tileUrlTemplates).length === 0) return { ...base, webMercator: false }
  return { ...base, webMercator: true, tileUrlTemplates, maxZoom: linked.matrixSet.maxZoom }
}

/**
 * Parses a WMTS 1.0.0 GetCapabilities document.
 * @param {object} params - Parameters.
 * @param {XmlElement} params.root - The Capabilities element.
 * @param {string} params.requestUrl - The capabilities request URL.
 * @returns {MapServiceCapabilities|null} The summary, or null when the document has no Contents.
 */
export const parseWmtsCapabilities = ({
  root,
  requestUrl,
}: {
  root: XmlElement
  requestUrl: string
}): MapServiceCapabilities | null => {
  const contents = firstChild(root, 'Contents')
  if (!contents) return null
  const context: WmtsLayerContext = {
    matrixSets: readMatrixSets(contents),
    kvpHref: readKvpHref(root, requestUrl),
    defaultAttribution: childText(firstChild(root, 'ServiceProvider'), 'ProviderName'),
  }
  const layerElements = childElements(contents, 'Layer')
  const layers = layerElements
    .slice(0, MAX_CAPABILITIES_LAYERS)
    .map((layer) => readWmtsLayer({ layer, context, requestUrl }))
  const formatsFound = new Set(layers.flatMap((layer) => Object.keys(layer.tileUrlTemplates ?? {})))
  return {
    kind: 'wmts',
    version: attributeOf(root, 'version') ?? '1.0.0',
    title: childText(firstChild(root, 'ServiceIdentification'), 'Title'),
    url: requestUrl,
    formats: mapImageFormats.filter((format) => formatsFound.has(format)),
    webMercator: layers.some((layer) => layer.webMercator),
    layers,
    truncated: layerElements.length > MAX_CAPABILITIES_LAYERS,
  }
}
