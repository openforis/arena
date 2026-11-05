import { clampOpacity, groupOverlays } from '@webapp/components/MapContainer/workspace/layers/customOverlays'
import { getUploadedFileKind } from '@webapp/components/MapContainer/workspace/uploaded/uploadedFiles'
import { computeBounds, isDataLayer } from '@webapp/components/MapContainer/workspace/tools/zoomToData'

describe('Map overlays, uploaded files and zoom to data (256)', () => {
  test('clampOpacity keeps 0.05–1, NaN becomes 1', () => {
    expect(clampOpacity(Number.NaN)).toBe(1)
    expect(clampOpacity(0)).toBe(0.05)
    expect(clampOpacity(-1)).toBe(0.05)
    expect(clampOpacity(0.5)).toBe(0.5)
    expect(clampOpacity(2)).toBe(1)
    expect(clampOpacity(Infinity)).toBe(1)
    expect(clampOpacity(-Infinity)).toBe(0.05)
  })

  test('groupOverlays keeps the order custom, scenes, uploaded and drops empty groups', () => {
    const overlays = [
      { id: 'u1', group: 'uploaded' as const },
      { id: 'c1', group: 'custom' as const },
      { id: 'u2', group: 'uploaded' as const },
    ]
    expect(groupOverlays(overlays)).toEqual([
      { group: 'custom', overlays: [overlays[1]] },
      { group: 'uploaded', overlays: [overlays[0], overlays[2]] },
    ])
    expect(groupOverlays([])).toEqual([])
  })

  test('getUploadedFileKind reads the extension, case-insensitive', () => {
    expect(getUploadedFileKind('a.KML')).toBe('kml')
    expect(getUploadedFileKind('a.b.kmz')).toBe('kmz')
    expect(getUploadedFileKind('shp.zip')).toBe('shapefileZip')
    expect(getUploadedFileKind('x.json')).toBe('geojson')
    expect(getUploadedFileKind('x.GeoJSON')).toBe('geojson')
    expect(getUploadedFileKind('.kml')).toBe('kml')
    expect(getUploadedFileKind('x.shp')).toBeNull()
    expect(getUploadedFileKind('noext')).toBeNull()
  })

  test('computeBounds skips non-finite points', () => {
    expect(computeBounds([])).toBeNull()
    expect(computeBounds([{ lat: Number.NaN, lng: 1 }])).toBeNull()
    expect(
      computeBounds([
        { lat: 41.9, lng: 12.5 },
        { lat: 43.9, lng: 14.5 },
        { lat: 42.9, lng: Number.POSITIVE_INFINITY },
        { lat: 42.9, lng: 13.5 },
      ])
    ).toEqual({ south: 41.9, west: 12.5, north: 43.9, east: 14.5 })
  })

  test('isDataLayer excludes tiles, non-interactive layers and tooltips', () => {
    expect(isDataLayer({ isGridLayer: true })).toBe(false)
    expect(isDataLayer({ isGridLayer: false })).toBe(true)
    expect(isDataLayer({ isGridLayer: false, interactive: false })).toBe(false)
    expect(isDataLayer({ isGridLayer: false, pane: 'tooltipPane' })).toBe(false)
    expect(isDataLayer({ isGridLayer: false, pane: 'markerPane' })).toBe(true)
  })
})
