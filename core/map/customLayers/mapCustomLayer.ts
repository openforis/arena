import { isUuid } from '@core/uuid'

export type MapImageFormat = 'image/png' | 'image/jpeg'
export type MapCustomLayerKind = 'wms' | 'wmts' | 'xyz'
export type MapCustomLayerRole = 'overlay' | 'baseMap'
export type MapCustomLayerScope = 'survey' | 'user'
export type MapWmsVersion = '1.1.1' | '1.3.0'

// what is stored (survey config or user prefs); WMTS layers are stored as their tile URL template
export type MapCustomLayer = {
  id: string // uuid
  kind: MapCustomLayerKind
  role: MapCustomLayerRole
  name: string
  url: string // WMS: GetMap endpoint; WMTS and XYZ: tile URL template with {z}, {x}, {y}
  wmsLayers?: string // WMS only: value of the LAYERS parameter
  wmsVersion?: MapWmsVersion // WMS only
  format: MapImageFormat
  opacity: number // 0.1–1
  attribution: string // plain text
  maxZoom?: number // deepest zoom level the service has tiles for
}

export type MapCustomLayerWithScope = MapCustomLayer & { scope: MapCustomLayerScope }

export const MAP_CUSTOM_LAYERS_MAX = 50 // per survey, and per user and survey
export const MAP_CUSTOM_LAYER_NAME_MAX_LENGTH = 100
export const MAP_CUSTOM_LAYER_ATTRIBUTION_MAX_LENGTH = 200
export const MAP_CUSTOM_LAYER_URL_MAX_LENGTH = 2048
export const MAP_CUSTOM_LAYER_WMS_LAYERS_MAX_LENGTH = 1000
export const MAP_CUSTOM_LAYER_MIN_OPACITY = 0.1
export const MAP_CUSTOM_LAYER_MAX_ZOOM = 24

export const mapImageFormats: readonly MapImageFormat[] = ['image/png', 'image/jpeg']
const kinds: readonly MapCustomLayerKind[] = ['wms', 'wmts', 'xyz']
const roles: readonly MapCustomLayerRole[] = ['overlay', 'baseMap']
const wmsVersions: readonly MapWmsVersion[] = ['1.1.1', '1.3.0']

// Leaflet tile URL placeholders: {s} subdomain, {r} retina suffix, {-y} TMS row
const TILE_PLACEHOLDERS = new Set(['z', 'x', 'y', '-y', 's', 'r'])
const PLACEHOLDER_PATTERN = /\{([^{}]*)\}/g

/**
 * Tells whether a value is one of the allowed values.
 * @param {readonly string[]} values - The allowed values.
 * @param {unknown} value - The value.
 * @returns {boolean} True when the value is one of them.
 */
const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (values as readonly string[]).includes(value)

/**
 * Tells whether a value is a plain object.
 * @param {unknown} value - The value.
 * @returns {boolean} True for non-array objects.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Tells whether a value is an absolute http(s) URL without credentials.
 * @param {unknown} value - The value.
 * @returns {boolean} True for http and https URLs up to 2048 characters.
 */
export const isHttpUrl = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAP_CUSTOM_LAYER_URL_MAX_LENGTH) return false
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password
  } catch {
    return false
  }
}

/**
 * Tells whether a value is an XYZ tile URL template: an http(s) URL with {z}, {x} and {y} (or {-y}), and no other
 * placeholder than {s} and {r}.
 * @param {unknown} value - The value.
 * @returns {boolean} True for valid templates.
 */
export const isTileTemplateUrl = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.length > MAP_CUSTOM_LAYER_URL_MAX_LENGTH) return false
  const placeholders = new Set(Array.from(value.matchAll(PLACEHOLDER_PATTERN), (match) => match[1]))
  for (const placeholder of placeholders) {
    if (!TILE_PLACEHOLDERS.has(placeholder)) return false
  }
  if (!placeholders.has('z') || !placeholders.has('x') || !(placeholders.has('y') || placeholders.has('-y')))
    return false
  const filled = value.replace(PLACEHOLDER_PATTERN, '0')
  return !filled.includes('{') && !filled.includes('}') && isHttpUrl(filled)
}

/**
 * Trims a text and checks its length.
 * @param {unknown} value - The value.
 * @param {number} maxLength - The maximum length after trimming.
 * @returns {string|null} The trimmed text, or null when it is not a string or too long.
 */
const sanitizeText = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text.length <= maxLength ? text : null
}

/**
 * Checks an opacity.
 * @param {unknown} value - The value.
 * @returns {number|null} The opacity, or null when it is not a number between 0.1 and 1.
 */
const sanitizeOpacity = (value: unknown): number | null =>
  typeof value === 'number' && value >= MAP_CUSTOM_LAYER_MIN_OPACITY && value <= 1 ? value : null

/**
 * Checks an optional maximum zoom level.
 * @param {unknown} value - The value.
 * @returns {number|undefined|null} The zoom level, undefined when absent, null when invalid.
 */
const sanitizeMaxZoom = (value: unknown): number | undefined | null => {
  if (value === undefined || value === null) return undefined
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAP_CUSTOM_LAYER_MAX_ZOOM
    ? (value as number)
    : null
}

/**
 * Checks the WMS-only properties.
 * @param {Record<string, unknown>} value - The layer.
 * @returns {{wmsLayers: string, wmsVersion: MapWmsVersion}|null} The properties, or null when invalid.
 */
const sanitizeWmsProps = (value: Record<string, unknown>): { wmsLayers: string; wmsVersion: MapWmsVersion } | null => {
  const wmsLayers = sanitizeText(value.wmsLayers, MAP_CUSTOM_LAYER_WMS_LAYERS_MAX_LENGTH)
  const wmsVersion = value.wmsVersion ?? '1.3.0'
  if (!wmsLayers || !isOneOf(wmsVersions, wmsVersion)) return null
  return { wmsLayers, wmsVersion }
}

/**
 * Tells whether a URL fits a layer kind.
 * @param {MapCustomLayerKind} kind - The kind.
 * @param {unknown} url - The URL.
 * @returns {boolean} WMS: an http(s) URL without braces; WMTS and XYZ: a tile URL template.
 */
const isUrlValidForKind = (kind: MapCustomLayerKind, url: unknown): url is string =>
  kind === 'wms' ? isHttpUrl(url) && !(url as string).includes('{') : isTileTemplateUrl(url)

/**
 * Checks a stored or submitted custom layer and keeps only its known properties.
 * @param {unknown} value - The layer.
 * @returns {MapCustomLayer|null} The clean layer, or null when it is invalid.
 */
export const sanitizeMapCustomLayer = (value: unknown): MapCustomLayer | null => {
  if (!isRecord(value)) return null
  const { id, kind, role, url, format = 'image/png' } = value
  if (typeof id !== 'string' || !isUuid(id)) return null
  if (!isOneOf(kinds, kind) || !isOneOf(roles, role) || !isOneOf(mapImageFormats, format)) return null
  if (!isUrlValidForKind(kind, url)) return null
  const name = sanitizeText(value.name, MAP_CUSTOM_LAYER_NAME_MAX_LENGTH)
  const attribution = sanitizeText(value.attribution ?? '', MAP_CUSTOM_LAYER_ATTRIBUTION_MAX_LENGTH)
  const opacity = sanitizeOpacity(value.opacity)
  const maxZoom = sanitizeMaxZoom(value.maxZoom)
  if (!name || attribution === null || opacity === null || maxZoom === null) return null
  const wmsProps = kind === 'wms' ? sanitizeWmsProps(value) : {}
  if (!wmsProps) return null
  return {
    id,
    kind,
    role,
    name,
    url,
    ...wmsProps,
    format,
    opacity,
    attribution,
    ...(maxZoom === undefined ? {} : { maxZoom }),
  }
}

/**
 * Reads stored layers, dropping the invalid ones (stored data is never trusted blindly).
 * @param {unknown} value - The stored value.
 * @returns {MapCustomLayer[]} The valid layers.
 */
export const sanitizeMapCustomLayers = (value: unknown): MapCustomLayer[] => {
  if (!Array.isArray(value)) return []
  const layers: MapCustomLayer[] = []
  for (const item of value) {
    const layer = sanitizeMapCustomLayer(item)
    if (layer) layers.push(layer)
  }
  return layers
}

/**
 * Validates the layers a client asks to add: all or nothing.
 * @param {unknown} value - The submitted layers.
 * @returns {MapCustomLayer[]|null} The clean layers, or null when the list is empty, too long, has duplicate ids or
 * contains an invalid layer.
 */
export const validateMapCustomLayers = (value: unknown): MapCustomLayer[] | null => {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAP_CUSTOM_LAYERS_MAX) return null
  const layers: MapCustomLayer[] = []
  const ids = new Set<string>()
  for (const item of value) {
    const layer = sanitizeMapCustomLayer(item)
    if (!layer || ids.has(layer.id)) return null
    ids.add(layer.id)
    layers.push(layer)
  }
  return layers
}

/**
 * Merges the survey and the user layers: survey layers first, hidden and duplicate ids skipped.
 * @param {object} params - Parameters.
 * @param {MapCustomLayer[]} params.surveyLayers - The layers shared with everyone in the survey.
 * @param {MapCustomLayer[]} params.userLayers - The layers of the current user.
 * @param {string[]} [params.hiddenLayerIds] - Ids hidden for this session.
 * @returns {MapCustomLayerWithScope[]} The layers with their scope.
 */
export const mergeMapCustomLayers = ({
  surveyLayers,
  userLayers,
  hiddenLayerIds = [],
}: {
  surveyLayers: MapCustomLayer[]
  userLayers: MapCustomLayer[]
  hiddenLayerIds?: string[]
}): MapCustomLayerWithScope[] => {
  const skippedIds = new Set(hiddenLayerIds)
  const result: MapCustomLayerWithScope[] = []
  const entries: Array<[MapCustomLayerScope, MapCustomLayer[]]> = [
    ['survey', surveyLayers],
    ['user', userLayers],
  ]
  for (const [scope, layers] of entries) {
    for (const layer of layers) {
      if (skippedIds.has(layer.id)) continue
      skippedIds.add(layer.id)
      result.push({ ...layer, scope })
    }
  }
  return result
}

/**
 * Tells whether the current user can delete a stored layer (others can only hide it for the session).
 * @param {object} params - Parameters.
 * @param {MapCustomLayerScope} params.scope - The layer scope.
 * @param {boolean} params.canEditSurvey - Whether the user can edit the survey.
 * @returns {boolean} True for the user's own layers, and for survey layers when the user can edit the survey.
 */
export const canRemoveMapCustomLayer = ({
  scope,
  canEditSurvey,
}: {
  scope: MapCustomLayerScope
  canEditSurvey: boolean
}): boolean => scope === 'user' || canEditSurvey
