import type { MapCustomLayer, MapCustomLayerWithScope } from '@core/map/customLayers/mapCustomLayer'
import {
  diffOverlayIds,
  findCustomBaseLayerDef,
  getCustomLayerLeafletConfig,
  toCustomBaseLayerDef,
  toCustomOverlayId,
} from '@webapp/components/MapContainer/workspace/customLayers/customLayerLeaflet'

const wmsLayer: MapCustomLayer = {
  id: '0d6f5b1e-3a1c-4f43-9a52-7b1e6c2d9f10',
  kind: 'wms',
  role: 'overlay',
  name: 'Forest cover',
  url: 'https://maps.example.org/geoserver/wms?map=forest',
  wmsLayers: 'forest:cover',
  wmsVersion: '1.1.1',
  format: 'image/png',
  opacity: 0.8,
  attribution: '<img src=x onerror=alert(1)> & "co"',
}

const tileLayer: MapCustomLayerWithScope = {
  id: '6a3e2c1b-5d4f-4e8a-9b7c-1d2e3f4a5b6c',
  kind: 'wmts',
  role: 'baseMap',
  name: 'Orthophoto',
  url: 'https://tiles.example.org/{z}/{y}/{x}.jpg',
  format: 'image/jpeg',
  opacity: 1,
  attribution: 'Mapping agency',
  maxZoom: 19,
  scope: 'user',
}

describe('map custom layer Leaflet helpers (272)', () => {
  test('builds a WMS overlay: GetMap parameters apart from the Leaflet options, escaped attribution', () => {
    expect(getCustomLayerLeafletConfig(wmsLayer)).toEqual({
      type: 'wms',
      url: 'https://maps.example.org/geoserver/wms?map=forest',
      params: { layers: 'forest:cover', styles: '', format: 'image/png', transparent: true, version: '1.1.1' },
      options: {
        opacity: 0.8,
        attribution: '&lt;img src=x onerror=alert(1)&gt; &amp; &quot;co&quot;',
        minZoom: 2,
        maxZoom: 17,
        zIndex: 100,
      },
    })
  })

  test('builds a tile base map, capping its native zoom at the map maximum', () => {
    expect(getCustomLayerLeafletConfig(tileLayer)).toEqual({
      type: 'tile',
      url: 'https://tiles.example.org/{z}/{y}/{x}.jpg',
      options: { opacity: 1, attribution: 'Mapping agency', minZoom: 2, maxZoom: 17, maxNativeZoom: 17 },
    })
    expect(getCustomLayerLeafletConfig({ ...tileLayer, maxZoom: 12 }).options.maxNativeZoom).toBe(12)
    expect(getCustomLayerLeafletConfig({ ...tileLayer, maxZoom: undefined }).options).not.toHaveProperty(
      'maxNativeZoom'
    )
  })

  test('finds custom base maps by the key Leaflet reports, never by their display name', () => {
    const def = toCustomBaseLayerDef(tileLayer)
    expect(def).toEqual({
      key: `custom:${tileLayer.id}`,
      name: `custom:${tileLayer.id}`,
      label: 'Orthophoto',
      attribution: 'Mapping agency',
      custom: tileLayer,
    })
    expect(findCustomBaseLayerDef({ controlName: def.name, customBaseLayerDefs: [def] })).toBe(def)
    expect(findCustomBaseLayerDef({ controlName: 'Orthophoto', customBaseLayerDefs: [def] })).toBeNull()
    expect(findCustomBaseLayerDef({ controlName: 'custom:other', customBaseLayerDefs: [def] })).toBeNull()
  })

  test('tells which overlays to register and unregister', () => {
    expect(toCustomOverlayId('abc')).toBe('custom-abc')
    expect(diffOverlayIds({ registeredIds: new Set(['a', 'b']), wantedIds: ['b', 'c'] })).toEqual({
      toAdd: ['c'],
      toRemove: ['a'],
    })
  })
})
