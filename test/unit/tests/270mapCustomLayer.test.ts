import {
  canRemoveMapCustomLayer,
  isHttpUrl,
  isTileTemplateUrl,
  MAP_CUSTOM_LAYERS_MAX,
  type MapCustomLayer,
  mergeMapCustomLayers,
  sanitizeMapCustomLayer,
  sanitizeMapCustomLayers,
  validateMapCustomLayers,
} from '@core/map/customLayers/mapCustomLayer'

const ids = [
  '0b0c5e9e-6f0e-4c5b-9a43-2c1f0d8e7a11',
  '5d7f3a2b-1c4e-4f6a-8b9c-0d1e2f3a4b5c',
  '9a8b7c6d-5e4f-4a3b-a2c1-d0e9f8a7b6c5',
]

/**
 * Builds a valid WMS layer.
 * @param {Partial<MapCustomLayer>} [overrides] - Properties to change.
 * @returns {MapCustomLayer} The layer.
 */
const wmsLayer = (overrides: Partial<MapCustomLayer> = {}): MapCustomLayer => ({
  id: ids[0],
  kind: 'wms',
  role: 'overlay',
  name: 'Forest cover',
  url: 'https://maps.example.org/wms',
  wmsLayers: 'forest:cover',
  wmsVersion: '1.3.0',
  format: 'image/png',
  opacity: 0.8,
  attribution: '© Agency',
  ...overrides,
})

/**
 * Builds a valid XYZ base map.
 * @param {Partial<MapCustomLayer>} [overrides] - Properties to change.
 * @returns {MapCustomLayer} The layer.
 */
const xyzLayer = (overrides: Partial<MapCustomLayer> = {}): MapCustomLayer => ({
  id: ids[1],
  kind: 'xyz',
  role: 'baseMap',
  name: 'OSM',
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  format: 'image/png',
  opacity: 1,
  attribution: '',
  ...overrides,
})

describe('map custom layer model (270)', () => {
  test('recognises http(s) URLs without credentials', () => {
    expect(isHttpUrl('https://example.org/wms')).toBe(true)
    expect(isHttpUrl('ftp://example.org/')).toBe(false)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('https://user:secret@example.org/')).toBe(false)
    expect(isHttpUrl(42)).toBe(false)
  })

  test.each([
    ['https://tile.openstreetmap.org/{z}/{x}/{y}.png', true],
    ['https://{s}.tiles.example.org/{z}/{x}/{-y}{r}.png', true],
    ['https://tiles.example.org/{z}/{x}.png', false],
    ['https://tiles.example.org/{z}/{x}/{y}/{foo}.png', false],
    ['javascript:{z}{x}{y}', false],
    ['https://tiles.example.org/{z}/{x}/{y}}.png', false],
    ['https://tiles.example.org/{z}/{x}/{y', false],
  ])('tells whether %s is a tile URL template (%s)', (url, expected) => {
    expect(isTileTemplateUrl(url)).toBe(expected)
  })

  test('keeps only the known properties, trimmed', () => {
    const dirty = { ...wmsLayer({ name: '  Forest cover ' }), scope: 'user', html: '<script>' }
    expect(sanitizeMapCustomLayer(dirty)).toEqual(wmsLayer())
  })

  test('fills the defaults of optional properties', () => {
    const minimal = {
      id: ids[0],
      kind: 'wms',
      role: 'overlay',
      name: 'Forest cover',
      url: 'https://maps.example.org/wms',
      wmsLayers: 'forest:cover',
      opacity: 0.8,
    }
    expect(sanitizeMapCustomLayer(minimal)).toEqual(wmsLayer({ attribution: '' }))
  })

  test.each([
    ['a non-uuid id', { id: 'abc' }],
    ['an unknown kind', { kind: 'wfs' }],
    ['an unknown role', { role: 'top' }],
    ['an unsupported format', { format: 'image/gif' }],
    ['a too low opacity', { opacity: 0.05 }],
    ['a too high opacity', { opacity: 1.5 }],
    ['an empty name', { name: '  ' }],
    ['a too long name', { name: 'n'.repeat(101) }],
    ['a too long attribution', { attribution: 'a'.repeat(201) }],
    ['a WMS layer without layer names', { wmsLayers: '' }],
    ['a WMS layer with a tile template', { url: 'https://maps.example.org/{z}/{x}/{y}.png' }],
    ['a non-http URL', { url: 'file:///etc/passwd' }],
    ['a fractional max zoom', { maxZoom: 3.5 }],
    ['a too deep max zoom', { maxZoom: 25 }],
  ])('refuses %s', (_description, overrides) => {
    expect(sanitizeMapCustomLayer({ ...wmsLayer(), ...overrides })).toBeNull()
  })

  test('refuses a tile layer without a tile template', () => {
    expect(sanitizeMapCustomLayer(xyzLayer({ url: 'https://tile.openstreetmap.org/' }))).toBeNull()
    expect(sanitizeMapCustomLayer(xyzLayer({ maxZoom: 19 }))).toEqual(xyzLayer({ maxZoom: 19 }))
  })

  test('reads stored layers leniently, dropping the invalid ones', () => {
    expect(sanitizeMapCustomLayers(null)).toEqual([])
    expect(sanitizeMapCustomLayers([wmsLayer(), { id: 'bad' }, xyzLayer()])).toEqual([wmsLayer(), xyzLayer()])
  })

  test('validates submitted layers all or nothing', () => {
    expect(validateMapCustomLayers([wmsLayer(), xyzLayer()])).toEqual([wmsLayer(), xyzLayer()])
    expect(validateMapCustomLayers([])).toBeNull()
    expect(validateMapCustomLayers('layers')).toBeNull()
    expect(validateMapCustomLayers([wmsLayer(), { id: 'bad' }])).toBeNull()
    expect(validateMapCustomLayers([wmsLayer(), wmsLayer({ name: 'Same id' })])).toBeNull()
    const tooMany = Array.from({ length: MAP_CUSTOM_LAYERS_MAX + 1 }, () => wmsLayer())
    expect(validateMapCustomLayers(tooMany)).toBeNull()
  })

  test('merges survey layers first, skipping hidden and duplicate ids', () => {
    const surveyLayers = [wmsLayer()]
    const userLayers = [xyzLayer(), wmsLayer({ name: 'Duplicate' })]
    expect(mergeMapCustomLayers({ surveyLayers, userLayers })).toEqual([
      { ...wmsLayer(), scope: 'survey' },
      { ...xyzLayer(), scope: 'user' },
    ])
    expect(mergeMapCustomLayers({ surveyLayers, userLayers, hiddenLayerIds: [ids[0]] })).toEqual([
      { ...xyzLayer(), scope: 'user' },
    ])
  })

  test('lets users delete their own layers, and survey layers only when they can edit the survey', () => {
    expect(canRemoveMapCustomLayer({ scope: 'user', canEditSurvey: false })).toBe(true)
    expect(canRemoveMapCustomLayer({ scope: 'survey', canEditSurvey: false })).toBe(false)
    expect(canRemoveMapCustomLayer({ scope: 'survey', canEditSurvey: true })).toBe(true)
  })
})
