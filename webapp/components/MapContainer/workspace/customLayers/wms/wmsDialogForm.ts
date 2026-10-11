import {
  isHttpUrl,
  isTileTemplateUrl,
  isValidWmsLayerName,
  MAP_CUSTOM_LAYERS_MAX,
  MAP_CUSTOM_LAYER_ATTRIBUTION_MAX_LENGTH,
  MAP_CUSTOM_LAYER_NAME_MAX_LENGTH,
  type MapCustomLayer,
  type MapCustomLayerRole,
  type MapCustomLayerScope,
  type MapImageFormat,
  mapImageFormats,
  type MapWmsVersion,
} from '@core/map/customLayers/mapCustomLayer'
import {
  MAX_CAPABILITIES_LAYERS,
  type MapServiceCapabilities,
  type MapServiceLayer,
} from '@core/map/customLayers/mapServiceCapabilities'

export type WmsLoadStatus = 'idle' | 'loading' | 'loaded' | 'failed'
export type WmsSource = 'capabilities' | 'xyz'
export type WmsUrlLoadMode = 'empty' | 'xyz' | 'capabilities' | 'invalid'
export type WmsFormMessage = { key: string; params?: Record<string, unknown> }
// a summary part is plain text or an i18n key
export type WmsSummaryPart = { text?: string; key?: string; params?: Record<string, unknown> }

export type WmsDialogFormState = {
  url: string
  loadStatus: WmsLoadStatus
  error: WmsFormMessage | null
  source: WmsSource | null
  capabilities: MapServiceCapabilities | null
  selectedLayerNames: string[]
  role: MapCustomLayerRole
  name: string
  nameEdited: boolean
  format: MapImageFormat
  opacity: number // percent, 10–100
  opacityEdited: boolean
  attribution: string
  attributionEdited: boolean
  scope: MapCustomLayerScope
  saving: boolean
}

export type WmsDialogFormAction =
  | { type: 'setUrl'; url: string }
  | { type: 'loadStarted' }
  | { type: 'loadFailed'; error: WmsFormMessage }
  | { type: 'xyzLoaded' }
  | { type: 'capabilitiesLoaded'; capabilities: MapServiceCapabilities }
  | { type: 'toggleLayer'; name: string }
  | { type: 'setRole'; role: MapCustomLayerRole }
  | { type: 'setName'; name: string }
  | { type: 'setFormat'; format: MapImageFormat }
  | { type: 'setOpacity'; opacity: number }
  | { type: 'setAttribution'; attribution: string }
  | { type: 'setScope'; scope: MapCustomLayerScope }
  | { type: 'savingChanged'; saving: boolean; error?: WmsFormMessage }

export const WMS_MIN_OPACITY_PERCENT = 10
// whitespace and control characters are never valid inside a URL (the model refuses them)
const URL_FORBIDDEN_PATTERN = /[\s\u0000-\u001f\u007f]/
const DEFAULT_OPACITY_PERCENT_BY_ROLE: Record<MapCustomLayerRole, number> = { overlay: 80, baseMap: 100 }

/**
 * Creates the initial state of the dialog.
 * @param {object} params - Parameters.
 * @param {boolean} params.canEditSurvey - Whether the user can share layers with everyone in the survey.
 * @returns {WmsDialogFormState} The state.
 */
export const createWmsDialogFormState = ({ canEditSurvey }: { canEditSurvey: boolean }): WmsDialogFormState => ({
  url: '',
  loadStatus: 'idle',
  error: null,
  source: null,
  capabilities: null,
  selectedLayerNames: [],
  role: 'overlay',
  name: '',
  nameEdited: false,
  format: 'image/png',
  opacity: DEFAULT_OPACITY_PERCENT_BY_ROLE.overlay,
  opacityEdited: false,
  attribution: '',
  attributionEdited: false,
  scope: canEditSurvey ? 'survey' : 'user',
  saving: false,
})

/**
 * Tells what "Load layers" does with a URL.
 * @param {string} url - The typed URL.
 * @returns {WmsUrlLoadMode} empty; xyz for a {z}/{x}/{y} template (no request); capabilities for a service URL; invalid.
 */
export const getUrlLoadMode = (url: string): WmsUrlLoadMode => {
  const value = url.trim()
  if (value.length === 0) return 'empty'
  if (URL_FORBIDDEN_PATTERN.test(value)) return 'invalid'
  if (value.includes('{')) return isTileTemplateUrl(value) ? 'xyz' : 'invalid'
  return isHttpUrl(value) ? 'capabilities' : 'invalid'
}

/**
 * Tells whether a layer of a service can be selected: it needs Web Mercator tiles, a WMS layer name the model
 * accepts, and for WMTS a non-empty identifier (a refused or empty name would make the whole batch fail).
 * @param {object} params - Parameters.
 * @param {MapServiceCapabilities} params.capabilities - The service.
 * @param {MapServiceLayer} params.layer - The layer.
 * @returns {boolean} True when the layer can be added.
 */
export const isLayerSelectable = ({
  capabilities,
  layer,
}: {
  capabilities: MapServiceCapabilities
  layer: MapServiceLayer
}): boolean =>
  layer.webMercator && (capabilities.kind === 'wms' ? isValidWmsLayerName(layer.name) : layer.name.length > 0)

/**
 * Returns the layers of the service that are selected, in service order.
 * @param {WmsDialogFormState} state - The state.
 * @returns {MapServiceLayer[]} The selected layers.
 */
export const getSelectedLayers = (state: WmsDialogFormState): MapServiceLayer[] => {
  const selected = new Set(state.selectedLayerNames)
  return (state.capabilities?.layers ?? []).filter((layer) => selected.has(layer.name))
}

/**
 * Lists the image formats the user can choose.
 * @param {WmsDialogFormState} state - The state.
 * @returns {MapImageFormat[]} WMS: the service formats; WMTS: the formats with a tile template for the selected layers
 * (all layers when none is selected); XYZ: none (the template decides).
 */
export const getAvailableFormats = (state: WmsDialogFormState): MapImageFormat[] => {
  const { capabilities, source } = state
  if (source !== 'capabilities' || !capabilities) return []
  if (capabilities.kind === 'wms') return capabilities.formats
  const selected = getSelectedLayers(state)
  const layers = selected.length > 0 ? selected : capabilities.layers
  return mapImageFormats.filter((format) => layers.some((layer) => layer.tileUrlTemplates?.[format]))
}

/**
 * Derives the hostname of a tile template for the default name.
 * @param {string} url - The template.
 * @returns {string} The hostname, or empty.
 */
const templateHostname = (url: string): string => {
  try {
    return new URL(url.trim().replace(/\{[^{}]*\}/g, '0')).hostname
  } catch {
    return ''
  }
}

/**
 * Fills the fields the user has not edited from the current source and selection.
 * @param {WmsDialogFormState} state - The state.
 * @returns {WmsDialogFormState} The state with name, attribution and format kept consistent.
 */
const withAutoFields = (state: WmsDialogFormState): WmsDialogFormState => {
  const [firstSelected] = getSelectedLayers(state)
  const autoName = state.source === 'xyz' ? templateHostname(state.url) : (firstSelected?.title ?? '')
  const formats = getAvailableFormats(state)
  return {
    ...state,
    name: state.nameEdited ? state.name : autoName,
    attribution: state.attributionEdited ? state.attribution : (firstSelected?.attribution ?? ''),
    format: formats.length > 0 && !formats.includes(state.format) ? formats[0] : state.format,
  }
}

/**
 * Selects the only usable layer of a service, so a one-layer service needs no extra click.
 * @param {MapServiceCapabilities} capabilities - The capabilities.
 * @returns {string[]} The preselected layer names.
 */
const preselectLayers = (capabilities: MapServiceCapabilities): string[] => {
  const usable = capabilities.layers.filter((layer) => isLayerSelectable({ capabilities, layer }))
  return usable.length === 1 ? [usable[0].name] : []
}

/**
 * Toggles a layer; layers that are not selectable cannot be selected, and no more than the maximum can be.
 * @param {WmsDialogFormState} state - The state.
 * @param {string} name - The layer name.
 * @returns {string[]} The new selection.
 */
const toggleLayerName = (state: WmsDialogFormState, name: string): string[] => {
  const { capabilities } = state
  const layer = capabilities?.layers.find((item) => item.name === name)
  if (!capabilities || !layer || !isLayerSelectable({ capabilities, layer })) return state.selectedLayerNames
  if (state.selectedLayerNames.includes(name)) return state.selectedLayerNames.filter((item) => item !== name)
  return state.selectedLayerNames.length >= MAP_CUSTOM_LAYERS_MAX
    ? state.selectedLayerNames
    : [...state.selectedLayerNames, name]
}

/**
 * Updates the state of the dialog.
 * @param {WmsDialogFormState} state - The state.
 * @param {WmsDialogFormAction} action - The action.
 * @returns {WmsDialogFormState} The new state.
 */
export const wmsDialogFormReducer = (state: WmsDialogFormState, action: WmsDialogFormAction): WmsDialogFormState => {
  switch (action.type) {
    case 'setUrl':
      return withAutoFields({
        ...state,
        url: action.url,
        loadStatus: 'idle',
        error: null,
        source: null,
        capabilities: null,
        selectedLayerNames: [],
      })
    case 'loadStarted':
      return { ...state, loadStatus: 'loading', error: null }
    case 'loadFailed':
      return { ...state, loadStatus: 'failed', error: action.error }
    case 'xyzLoaded':
      return withAutoFields({
        ...state,
        loadStatus: 'loaded',
        source: 'xyz',
        capabilities: null,
        selectedLayerNames: [],
      })
    case 'capabilitiesLoaded': {
      const { capabilities } = action
      const selectedLayerNames = preselectLayers(capabilities)
      return withAutoFields({
        ...state,
        loadStatus: 'loaded',
        source: 'capabilities',
        capabilities,
        selectedLayerNames,
      })
    }
    case 'toggleLayer':
      return withAutoFields({ ...state, selectedLayerNames: toggleLayerName(state, action.name) })
    case 'setRole': {
      const opacity = state.opacityEdited ? state.opacity : DEFAULT_OPACITY_PERCENT_BY_ROLE[action.role]
      return { ...state, role: action.role, opacity }
    }
    case 'setName':
      return { ...state, name: action.name, nameEdited: true }
    case 'setFormat':
      return { ...state, format: action.format }
    case 'setOpacity': {
      if (!Number.isFinite(action.opacity)) return state
      const opacity = Math.min(100, Math.max(WMS_MIN_OPACITY_PERCENT, Math.round(action.opacity)))
      return { ...state, opacity, opacityEdited: true }
    }
    case 'setAttribution':
      return { ...state, attribution: action.attribution, attributionEdited: true }
    case 'setScope':
      return { ...state, scope: action.scope }
    case 'savingChanged':
      return { ...state, saving: action.saving, error: action.error ?? null }
    default:
      return state
  }
}

/**
 * Describes what was loaded ("WMS 1.3.0 · 4 layers · Web Mercator supported").
 * @param {WmsDialogFormState} state - The state.
 * @returns {WmsSummaryPart[]} The parts, empty before loading.
 */
export const getSummary = (state: WmsDialogFormState): WmsSummaryPart[] => {
  if (state.loadStatus !== 'loaded') return []
  if (state.source === 'xyz') return [{ key: 'mapWorkspace.wms.xyzSummary' }]
  const { capabilities } = state
  if (!capabilities) return []
  const parts: WmsSummaryPart[] = [
    { text: `${capabilities.kind.toUpperCase()} ${capabilities.version}` },
    { key: 'mapWorkspace.wms.layersCount', params: { count: capabilities.layers.length } },
    { key: capabilities.webMercator ? 'mapWorkspace.wms.webMercatorSupported' : 'mapWorkspace.wms.webMercatorMissing' },
  ]
  if (capabilities.truncated)
    parts.push({ key: 'mapWorkspace.wms.truncated', params: { max: MAX_CAPABILITIES_LAYERS } })
  return parts
}

/**
 * Counts the layers the submit button adds.
 * @param {WmsDialogFormState} state - The state.
 * @returns {number} 1 for XYZ, else the number of selected layers.
 */
const countLayersToAdd = (state: WmsDialogFormState): number =>
  state.source === 'xyz' ? 1 : state.selectedLayerNames.length

/**
 * Builds the label of the submit button ("Add 2 overlays").
 * @param {WmsDialogFormState} state - The state.
 * @returns {WmsFormMessage} The i18n key and its count.
 */
export const getSubmitLabel = (state: WmsDialogFormState): WmsFormMessage => ({
  key: state.role === 'baseMap' ? 'mapWorkspace.wms.submitBaseMaps' : 'mapWorkspace.wms.submitOverlays',
  params: { count: countLayersToAdd(state) },
})

/**
 * Tells whether one display name is used (one layer), so the name field is enabled and required.
 * @param {WmsDialogFormState} state - The state.
 * @returns {boolean} True when exactly one layer is added.
 */
export const isSingleLayer = (state: WmsDialogFormState): boolean => countLayersToAdd(state) === 1

/**
 * Tells whether the dialog can be submitted.
 * @param {WmsDialogFormState} state - The state.
 * @returns {boolean} True when something is loaded and selected, and the single layer has a name.
 */
export const canSubmit = (state: WmsDialogFormState): boolean => {
  const count = countLayersToAdd(state)
  if (state.saving || state.loadStatus !== 'loaded' || count === 0 || count > MAP_CUSTOM_LAYERS_MAX) return false
  return !isSingleLayer(state) || state.name.trim().length > 0
}

/**
 * Cuts a text to the stored maximum length (service titles can be longer than the server accepts).
 * @param {string} text - The text.
 * @param {number} maxLength - The maximum length.
 * @returns {string} The trimmed, cut text.
 */
const fit = (text: string, maxLength: number): string => text.trim().slice(0, maxLength).trim()

/**
 * Builds the WMTS part of a layer: the template of the chosen format, else the first one.
 * @param {MapServiceLayer} layer - The service layer.
 * @param {MapImageFormat} format - The chosen format.
 * @returns {{url: string, format: MapImageFormat}} The template and its format.
 */
const pickWmtsTemplate = (layer: MapServiceLayer, format: MapImageFormat): { url: string; format: MapImageFormat } => {
  const templates = layer.tileUrlTemplates ?? {}
  if (templates[format]) return { url: templates[format] as string, format }
  const fallback = mapImageFormats.find((item) => templates[item]) ?? format
  return { url: templates[fallback] ?? '', format: fallback }
}

/**
 * Builds the layer stored for one selected service layer.
 * @param {object} params - Parameters.
 * @param {WmsDialogFormState} params.state - The state.
 * @param {MapServiceLayer} params.layer - The service layer.
 * @param {MapCustomLayer} params.common - The properties shared by every added layer.
 * @returns {MapCustomLayer} The layer.
 */
const buildServiceLayer = ({
  state,
  layer,
  common,
}: {
  state: WmsDialogFormState
  layer: MapServiceLayer
  common: MapCustomLayer
}): MapCustomLayer => {
  const single = isSingleLayer(state)
  const capabilities = state.capabilities as MapServiceCapabilities
  const name = single ? common.name : fit(layer.title, MAP_CUSTOM_LAYER_NAME_MAX_LENGTH)
  const attribution =
    single || state.attributionEdited
      ? common.attribution
      : fit(layer.attribution, MAP_CUSTOM_LAYER_ATTRIBUTION_MAX_LENGTH)
  if (capabilities.kind === 'wms') {
    const wmsVersion = capabilities.version as MapWmsVersion
    return { ...common, kind: 'wms', name, attribution, url: capabilities.url, wmsLayers: layer.name, wmsVersion }
  }
  const { url, format } = pickWmtsTemplate(layer, state.format)
  return { ...common, kind: 'wmts', name, attribution, url, format, maxZoom: layer.maxZoom }
}

/**
 * Builds the layers to store from the dialog.
 * @param {object} params - Parameters.
 * @param {WmsDialogFormState} params.state - The state.
 * @param {Function} params.newId - Creates a layer id (uuid).
 * @returns {MapCustomLayer[]} One layer for XYZ, one per selected service layer otherwise.
 */
export const buildMapCustomLayers = ({
  state,
  newId,
}: {
  state: WmsDialogFormState
  newId: () => string
}): MapCustomLayer[] => {
  const common: MapCustomLayer = {
    id: '',
    kind: 'xyz',
    role: state.role,
    name: fit(state.name, MAP_CUSTOM_LAYER_NAME_MAX_LENGTH),
    url: state.url.trim(),
    format: state.format,
    opacity: state.opacity / 100,
    attribution: fit(state.attribution, MAP_CUSTOM_LAYER_ATTRIBUTION_MAX_LENGTH),
  }
  if (state.source === 'xyz') return [{ ...common, id: newId() }]
  return getSelectedLayers(state).map((layer) =>
    buildServiceLayer({ state, layer, common: { ...common, id: newId() } })
  )
}

/**
 * Reads the message of a failed API call: the server's appErrors key when there is one.
 * @param {unknown} error - The axios error.
 * @param {string} fallbackKey - The key used otherwise.
 * @returns {WmsFormMessage} The message.
 */
export const toErrorMessage = (error: unknown, fallbackKey: string): WmsFormMessage => {
  const data = (error as { response?: { data?: { key?: unknown; params?: Record<string, unknown> } } })?.response?.data
  if (typeof data?.key === 'string' && data.key.startsWith('appErrors:')) return { key: data.key, params: data.params }
  return { key: fallbackKey }
}

/**
 * Tells whether a key pressed in the dialog must be kept from the map shortcuts ("m" typed in a field, or pressed on
 * a focused button, must not start a tool). Escape still reaches them: it closes the dialog.
 * @param {string} key - The KeyboardEvent key.
 * @returns {boolean} True when the event propagation must stop.
 */
export const stopsMapShortcut = (key: string): boolean => key !== 'Escape'

/**
 * Tells whether the URL being added would be blocked by the browser as mixed content: an http: tile URL on an https:
 * page.
 * @param {object} params - Parameters.
 * @param {string} params.pageProtocol - The protocol of the page (window.location.protocol).
 * @param {string|null|undefined} params.url - The XYZ template, or the GetMap / tile template URL of the service.
 * @returns {boolean} True when the page is https: and the URL starts with http:.
 */
export const isInsecureTileUrl = ({
  pageProtocol,
  url,
}: {
  pageProtocol: string
  url: string | null | undefined
}): boolean => pageProtocol === 'https:' && /^http:/i.test((url ?? '').trim())

/**
 * Returns the URL the loaded source adds, to check its protocol.
 * @param {WmsDialogFormState} state - The state.
 * @returns {string|null} The typed template for XYZ; the GetMap URL for WMS; the first selected layer's tile template
 * (else the first layer's) for WMTS; null before loading.
 */
export const getLoadedTileUrl = (state: WmsDialogFormState): string | null => {
  if (state.loadStatus !== 'loaded') return null
  if (state.source === 'xyz') return state.url
  const { capabilities } = state
  if (!capabilities) return null
  if (capabilities.kind === 'wms') return capabilities.url
  const [layer] = getSelectedLayers(state).concat(capabilities.layers)
  const templates = layer?.tileUrlTemplates ?? {}
  return templates[state.format] ?? Object.values(templates)[0] ?? null
}
