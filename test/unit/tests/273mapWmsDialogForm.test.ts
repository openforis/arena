import type { MapServiceCapabilities } from '@core/map/customLayers/mapServiceCapabilities'
import { MAP_CUSTOM_LAYERS_MAX } from '@core/map/customLayers/mapCustomLayer'
import {
  buildMapCustomLayers,
  canSubmit,
  createWmsDialogFormState,
  getAvailableFormats,
  getSubmitLabel,
  getSummary,
  getLoadedTileUrl,
  getUrlLoadMode,
  isInsecureTileUrl,
  isLayerSelectable,
  toErrorMessage,
  type WmsDialogFormAction,
  type WmsDialogFormState,
  wmsDialogFormReducer,
} from '@webapp/components/MapContainer/workspace/customLayers/wms/wmsDialogForm'

const wmsCapabilities: MapServiceCapabilities = {
  kind: 'wms',
  version: '1.3.0',
  title: 'Forest maps',
  url: 'https://maps.example.org/wms',
  formats: ['image/png', 'image/jpeg'],
  webMercator: true,
  truncated: false,
  layers: [
    { name: 'cover', title: 'Forest cover', webMercator: true, attribution: 'Agency' },
    { name: 'loss', title: 'Forest loss', webMercator: true, attribution: 'Hansen' },
    { name: 'lambert', title: 'Lambert only', webMercator: false, attribution: '' },
  ],
}

const wmtsCapabilities: MapServiceCapabilities = {
  kind: 'wmts',
  version: '1.0.0',
  title: 'Tiles',
  url: 'https://tiles.example.org/wmts',
  formats: ['image/jpeg'],
  webMercator: true,
  truncated: true,
  layers: [
    {
      name: 'ortho',
      title: 'Orthophoto',
      webMercator: true,
      attribution: 'Mapping agency',
      tileUrlTemplates: { 'image/jpeg': 'https://tiles.example.org/ortho/{z}/{y}/{x}.jpg' },
      maxZoom: 19,
    },
  ],
}

/**
 * Applies actions to the initial state.
 * @param {WmsDialogFormAction[]} actions - The actions.
 * @param {boolean} [canEditSurvey] - Whether the user can edit the survey.
 * @returns {WmsDialogFormState} The state.
 */
const run = (actions: WmsDialogFormAction[], canEditSurvey = true): WmsDialogFormState =>
  actions.reduce(wmsDialogFormReducer, createWmsDialogFormState({ canEditSurvey }))

/**
 * Creates sequential ids.
 * @returns {Function} The id factory.
 */
const sequentialIds = (): (() => string) => {
  let count = 0
  return () => {
    count += 1
    return `id-${count}`
  }
}

describe('map WMS dialog form (273)', () => {
  test('defaults the scope to the survey only for survey editors', () => {
    expect(createWmsDialogFormState({ canEditSurvey: true }).scope).toBe('survey')
    expect(createWmsDialogFormState({ canEditSurvey: false }).scope).toBe('user')
  })

  test('tells XYZ templates from service URLs', () => {
    expect(getUrlLoadMode('  ')).toBe('empty')
    expect(getUrlLoadMode('https://tile.example.org/{z}/{x}/{y}.png')).toBe('xyz')
    expect(getUrlLoadMode('https://tile.example.org/{z}/{x}.png')).toBe('invalid')
    expect(getUrlLoadMode('https://maps.example.org/wms')).toBe('capabilities')
    expect(getUrlLoadMode('file:///etc/passwd')).toBe('invalid')
  })

  test('preselects the only usable layer and names the layer after it', () => {
    const oneUsable = { ...wmsCapabilities, layers: wmsCapabilities.layers.slice(1) }
    const state = run([{ type: 'capabilitiesLoaded', capabilities: oneUsable }])
    expect(state.selectedLayerNames).toEqual(['loss'])
    expect(state.name).toBe('Forest loss')
    expect(state.attribution).toBe('Hansen')
  })

  test('ignores layers without Web Mercator tiles and keeps an edited name', () => {
    const state = run([
      { type: 'capabilitiesLoaded', capabilities: wmsCapabilities },
      { type: 'toggleLayer', name: 'lambert' },
      { type: 'setName', name: 'My layer' },
      { type: 'toggleLayer', name: 'cover' },
    ])
    expect(state.selectedLayerNames).toEqual(['cover'])
    expect(state.name).toBe('My layer')
  })

  test('summarises the service and labels the submit button with the count', () => {
    const state = run([
      { type: 'capabilitiesLoaded', capabilities: wmsCapabilities },
      { type: 'toggleLayer', name: 'cover' },
      { type: 'toggleLayer', name: 'loss' },
      { type: 'setRole', role: 'baseMap' },
    ])
    expect(getSummary(state)).toEqual([
      { text: 'WMS 1.3.0' },
      { key: 'mapWorkspace.wms.layersCount', params: { count: 3 } },
      { key: 'mapWorkspace.wms.webMercatorSupported' },
    ])
    expect(getSubmitLabel(state)).toEqual({ key: 'mapWorkspace.wms.submitBaseMaps', params: { count: 2 } })
    expect(state.opacity).toBe(100)
    expect(getSummary(run([{ type: 'capabilitiesLoaded', capabilities: wmtsCapabilities }]))).toContainEqual({
      key: 'mapWorkspace.wms.truncated',
      params: { max: 500 },
    })
  })

  test('clamps the opacity and keeps an edited one when the role changes', () => {
    const state = run([
      { type: 'setOpacity', opacity: 3 },
      { type: 'setRole', role: 'baseMap' },
    ])
    expect(state.opacity).toBe(10)
  })

  test('builds one WMS layer per selected layer, named after each title, in service order', () => {
    const state = run([
      { type: 'capabilitiesLoaded', capabilities: wmsCapabilities },
      { type: 'toggleLayer', name: 'loss' },
      { type: 'toggleLayer', name: 'cover' },
      { type: 'setFormat', format: 'image/jpeg' },
      { type: 'setScope', scope: 'user' },
    ])
    expect(canSubmit(state)).toBe(true)
    expect(buildMapCustomLayers({ state, newId: sequentialIds() })).toEqual([
      {
        id: 'id-1',
        kind: 'wms',
        role: 'overlay',
        name: 'Forest cover',
        url: 'https://maps.example.org/wms',
        wmsLayers: 'cover',
        wmsVersion: '1.3.0',
        format: 'image/jpeg',
        opacity: 0.8,
        attribution: 'Agency',
      },
      {
        id: 'id-2',
        kind: 'wms',
        role: 'overlay',
        name: 'Forest loss',
        url: 'https://maps.example.org/wms',
        wmsLayers: 'loss',
        wmsVersion: '1.3.0',
        format: 'image/jpeg',
        opacity: 0.8,
        attribution: 'Hansen',
      },
    ])
  })

  test('builds a WMTS layer from the template of an available format', () => {
    const state = run([{ type: 'capabilitiesLoaded', capabilities: wmtsCapabilities }])
    expect(getAvailableFormats(state)).toEqual(['image/jpeg'])
    expect(state.format).toBe('image/jpeg')
    const [layer] = buildMapCustomLayers({ state, newId: sequentialIds() })
    expect(layer).toMatchObject({
      kind: 'wmts',
      name: 'Orthophoto',
      url: 'https://tiles.example.org/ortho/{z}/{y}/{x}.jpg',
      format: 'image/jpeg',
      maxZoom: 19,
    })
  })

  test('builds one XYZ layer named after the host, and needs a name', () => {
    const url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    const state = run([{ type: 'setUrl', url }, { type: 'xyzLoaded' }])
    expect(state.name).toBe('tile.openstreetmap.org')
    expect(buildMapCustomLayers({ state, newId: sequentialIds() })).toEqual([
      {
        id: 'id-1',
        kind: 'xyz',
        role: 'overlay',
        name: 'tile.openstreetmap.org',
        url,
        format: 'image/png',
        opacity: 0.8,
        attribution: '',
      },
    ])
    expect(canSubmit(wmsDialogFormReducer(state, { type: 'setName', name: ' ' }))).toBe(false)
  })

  test('a new URL drops what was loaded', () => {
    const state = run([
      { type: 'capabilitiesLoaded', capabilities: wmtsCapabilities },
      { type: 'setUrl', url: 'https://other.example.org/wms' },
    ])
    expect(state).toMatchObject({ loadStatus: 'idle', capabilities: null, selectedLayerNames: [], name: '' })
    expect(canSubmit(state)).toBe(false)
  })

  test('shows the server error key, or a fallback', () => {
    const serverError = { response: { data: { key: 'appErrors:mapCustomLayers.urlNotAllowed', params: {} } } }
    expect(toErrorMessage(serverError, 'mapWorkspace.wms.errors.loadFailed')).toEqual({
      key: 'appErrors:mapCustomLayers.urlNotAllowed',
      params: {},
    })
    expect(toErrorMessage(new Error('Network Error'), 'mapWorkspace.wms.errors.loadFailed')).toEqual({
      key: 'mapWorkspace.wms.errors.loadFailed',
    })
  })

  test('refuses WMS layer names the model refuses, and toggles a selected layer off', () => {
    const names = ['a&b', 'x=y', '100%', 'a#b', 'a?b', 'a\u0001b', 'x'.repeat(1001)]
    const capabilities: MapServiceCapabilities = {
      ...wmsCapabilities,
      layers: [
        ...wmsCapabilities.layers.slice(0, 2),
        ...names.map((name) => ({ name, title: name, webMercator: true, attribution: '' })),
      ],
    }
    const loaded = run([{ type: 'capabilitiesLoaded', capabilities }])
    let state = loaded
    for (const name of names) state = wmsDialogFormReducer(state, { type: 'toggleLayer', name })
    expect(state.selectedLayerNames).toEqual([])
    expect(isLayerSelectable({ capabilities, layer: capabilities.layers[2] })).toBe(false)
    expect(isLayerSelectable({ capabilities, layer: capabilities.layers[0] })).toBe(true)
    state = wmsDialogFormReducer(state, { type: 'toggleLayer', name: 'cover' })
    expect(state.selectedLayerNames).toEqual(['cover'])
    state = wmsDialogFormReducer(state, { type: 'toggleLayer', name: 'cover' })
    expect(state.selectedLayerNames).toEqual([])
    expect(canSubmit(state)).toBe(false)
  })

  test('does not select more layers than the maximum', () => {
    const layers = Array.from({ length: MAP_CUSTOM_LAYERS_MAX + 1 }, (_, index) => ({
      name: `l${index}`,
      title: `Layer ${index}`,
      webMercator: true,
      attribution: '',
    }))
    let state = run([{ type: 'capabilitiesLoaded', capabilities: { ...wmsCapabilities, layers } }])
    for (const layer of layers) state = wmsDialogFormReducer(state, { type: 'toggleLayer', name: layer.name })
    expect(state.selectedLayerNames).toHaveLength(MAP_CUSTOM_LAYERS_MAX)
    expect(canSubmit(state)).toBe(true)
    expect(canSubmit({ ...state, selectedLayerNames: layers.map((layer) => layer.name) })).toBe(false)
  })

  test('refuses URLs with whitespace or control characters', () => {
    expect(getUrlLoadMode('https://a.org/a b/{z}/{x}/{y}.png')).toBe('invalid')
    expect(getUrlLoadMode('https://a.org/wms?x=a b')).toBe('invalid')
    expect(getUrlLoadMode('https://a.org/{z}/{x}/{y}\u0001.png')).toBe('invalid')
    expect(getUrlLoadMode('  https://a.org/wms  ')).toBe('capabilities')
  })

  test('ignores a non-finite opacity', () => {
    const state = run([{ type: 'setOpacity', opacity: 50 }])
    expect(wmsDialogFormReducer(state, { type: 'setOpacity', opacity: Number.NaN })).toBe(state)
    expect(wmsDialogFormReducer(state, { type: 'setOpacity', opacity: Number.POSITIVE_INFINITY })).toBe(state)
  })

  test('a WMTS layer needs an identifier to be selectable', () => {
    const [ortho] = wmtsCapabilities.layers
    expect(isLayerSelectable({ capabilities: wmtsCapabilities, layer: ortho })).toBe(true)
    expect(isLayerSelectable({ capabilities: wmtsCapabilities, layer: { ...ortho, name: '', title: '' } })).toBe(false)
  })

  test('flags http: tile URLs only on an https: page', () => {
    const url = 'http://tiles.example.org/{z}/{x}/{y}.png'
    expect(isInsecureTileUrl({ pageProtocol: 'https:', url })).toBe(true)
    expect(isInsecureTileUrl({ pageProtocol: 'https:', url: ` HTTP://tiles.example.org/` })).toBe(true)
    expect(isInsecureTileUrl({ pageProtocol: 'http:', url })).toBe(false)
    expect(isInsecureTileUrl({ pageProtocol: 'https:', url: 'https://tiles.example.org/{z}/{x}/{y}.png' })).toBe(false)
    expect(isInsecureTileUrl({ pageProtocol: 'https:', url: null })).toBe(false)
  })

  test('finds the URL a loaded source adds', () => {
    expect(getLoadedTileUrl(run([]))).toBeNull()
    const xyzUrl = 'http://tiles.example.org/{z}/{x}/{y}.png'
    expect(getLoadedTileUrl(run([{ type: 'setUrl', url: xyzUrl }, { type: 'xyzLoaded' }]))).toBe(xyzUrl)
    const wms = run([
      { type: 'setUrl', url: 'https://maps.example.org/wms' },
      { type: 'capabilitiesLoaded', capabilities: wmsCapabilities },
    ])
    expect(getLoadedTileUrl(wms)).toBe('https://maps.example.org/wms')
    const wmts = run([
      { type: 'setUrl', url: 'https://tiles.example.org/wmts' },
      { type: 'capabilitiesLoaded', capabilities: wmtsCapabilities },
    ])
    expect(getLoadedTileUrl(wmts)).toBe('https://tiles.example.org/ortho/{z}/{y}/{x}.jpg')
  })
})
