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

  describe('hardening', () => {
    test('trims the URL and refuses whitespace or control characters inside it', () => {
      expect(sanitizeMapCustomLayer(wmsLayer({ url: '  https://maps.example.org/wms\n' }))).toEqual(wmsLayer())
      expect(sanitizeMapCustomLayer(wmsLayer({ url: 'https://maps.example.org/w ms' }))).toBeNull()
      expect(sanitizeMapCustomLayer(wmsLayer({ url: 'https://maps.example.org/w\tms' }))).toBeNull()
      expect(sanitizeMapCustomLayer(xyzLayer({ url: ' https://tile.example.org/{z}/{x}/{y}.png ' }))).toEqual(
        xyzLayer({ url: 'https://tile.example.org/{z}/{x}/{y}.png' })
      )
      expect(sanitizeMapCustomLayer(xyzLayer({ url: 'https://tile.example.org/{z}/{x}/{y}.png\u0000' }))).toBeNull()
    })

    test.each([['a&b'], ['a=b'], ['a%20b'], ['a#b'], ['a?b'], ['a\u0000b'], ['a\nb']])(
      'refuses the WMS layer names %j',
      (wmsLayers) => {
        expect(sanitizeMapCustomLayer(wmsLayer({ wmsLayers }))).toBeNull()
      }
    )

    test('keeps the usual WMS layer name characters', () => {
      const wmsLayers = 'ns:forest_cover-2020.v1,ns:roads'
      expect(sanitizeMapCustomLayer(wmsLayer({ wmsLayers }))).toEqual(wmsLayer({ wmsLayers }))
    })

    test('refuses a WMS URL with a closing brace', () => {
      expect(sanitizeMapCustomLayer(wmsLayer({ url: 'https://maps.example.org/wms}' }))).toBeNull()
    })

    test('reads at most the maximum, dropping duplicate ids and keeping the first', () => {
      const duplicate = wmsLayer({ name: 'Duplicate' })
      expect(sanitizeMapCustomLayers([wmsLayer(), duplicate, xyzLayer()])).toEqual([wmsLayer(), xyzLayer()])
      const many = Array.from({ length: MAP_CUSTOM_LAYERS_MAX + 5 }, (_unused, index) =>
        wmsLayer({ id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}` })
      )
      expect(sanitizeMapCustomLayers(many)).toHaveLength(MAP_CUSTOM_LAYERS_MAX)
    })

    test('ignores prototype keys and prototype names', () => {
      const polluted = JSON.parse(
        `{"__proto__":{"polluted":true},"constructor":{"x":1},${JSON.stringify(wmsLayer()).slice(1)}`
      )
      expect(sanitizeMapCustomLayer(polluted)).toEqual(wmsLayer())
      expect(({} as Record<string, unknown>).polluted).toBeUndefined()
      expect(sanitizeMapCustomLayer(wmsLayer({ kind: 'constructor' as never }))).toBeNull()
      expect(sanitizeMapCustomLayer(wmsLayer({ role: '__proto__' as never }))).toBeNull()
    })

    test('refuses non-object items and non-array lists', () => {
      for (const item of [null, undefined, 42, 'layer', true, [], [wmsLayer()]]) {
        expect(sanitizeMapCustomLayer(item)).toBeNull()
      }
      expect(sanitizeMapCustomLayers([null, 1, 'x', wmsLayer()])).toEqual([wmsLayer()])
      expect(sanitizeMapCustomLayers({ length: 1, 0: wmsLayer() })).toEqual([])
      expect(validateMapCustomLayers([null])).toBeNull()
    })

    test('refuses too long URLs and WMS layer names', () => {
      expect(sanitizeMapCustomLayer(wmsLayer({ url: `https://maps.example.org/${'a'.repeat(2048)}` }))).toBeNull()
      expect(sanitizeMapCustomLayer(wmsLayer({ wmsLayers: 'a'.repeat(1000) }))).not.toBeNull()
      expect(sanitizeMapCustomLayer(wmsLayer({ wmsLayers: 'a'.repeat(1001) }))).toBeNull()
    })

    test('checks the WMS version, format and attribution types', () => {
      expect(sanitizeMapCustomLayer(wmsLayer({ wmsVersion: '1.0.0' as never }))).toBeNull()
      expect(sanitizeMapCustomLayer(wmsLayer({ wmsVersion: 1.3 as never }))).toBeNull()
      expect(sanitizeMapCustomLayer(wmsLayer({ format: null as never }))).toBeNull()
      expect(sanitizeMapCustomLayer(wmsLayer({ attribution: 5 as never }))).toBeNull()
      expect(sanitizeMapCustomLayer(wmsLayer({ attribution: null as never }))).toBeNull()
    })

    test('checks the zoom and opacity bounds', () => {
      expect(sanitizeMapCustomLayer(xyzLayer({ maxZoom: null as never }))).toEqual(xyzLayer())
      expect(sanitizeMapCustomLayer(xyzLayer({ maxZoom: 0 }))).toEqual(xyzLayer({ maxZoom: 0 }))
      expect(sanitizeMapCustomLayer(xyzLayer({ maxZoom: 24 }))).toEqual(xyzLayer({ maxZoom: 24 }))
      expect(sanitizeMapCustomLayer(xyzLayer({ maxZoom: -1 }))).toBeNull()
      expect(sanitizeMapCustomLayer(xyzLayer({ opacity: 0.1 }))).toEqual(xyzLayer({ opacity: 0.1 }))
      expect(sanitizeMapCustomLayer(xyzLayer({ opacity: 1 }))).toEqual(xyzLayer())
      expect(sanitizeMapCustomLayer(xyzLayer({ opacity: Number.NaN }))).toBeNull()
      expect(sanitizeMapCustomLayer(xyzLayer({ opacity: '1' as never }))).toBeNull()
    })

    test('accepts exactly the maximum number of layers and refuses duplicate ids', () => {
      const layers = Array.from({ length: MAP_CUSTOM_LAYERS_MAX }, (_unused, index) =>
        wmsLayer({ id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}` })
      )
      expect(validateMapCustomLayers(layers)).toHaveLength(MAP_CUSTOM_LAYERS_MAX)
      expect(validateMapCustomLayers([wmsLayer(), wmsLayer()])).toBeNull()
    })

    test('merges duplicate ids of one scope once', () => {
      const merged = mergeMapCustomLayers({ surveyLayers: [wmsLayer(), wmsLayer({ name: 'Again' })], userLayers: [] })
      expect(merged).toEqual([{ ...wmsLayer(), scope: 'survey' }])
    })
  })
})
