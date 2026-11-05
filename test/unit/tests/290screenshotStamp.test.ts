import { formatCoordinates } from '@webapp/components/MapContainer/workspace/statusbar/coordinateFormat'
import {
  getBaseMapName,
  buildStampLines,
  collectAttributions,
  formatStampCoordinates,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotStamp'

// plain text: the HTML decoding is the browser's DOMParser, absent from the node test environment
const esri = 'Esri, Maxar, Earthstar Geographics, and the GIS User Community'

describe('Screenshot stamp (290)', () => {
  test('collects the base layer attribution and those of the visible overlays, once each', () => {
    expect(
      collectAttributions({
        baseLayerAttribution: esri,
        overlays: [
          { visible: true, attribution: 'Contains modified Copernicus Sentinel data 2026' },
          { visible: false, attribution: 'Hidden layer' },
          { visible: true },
          { visible: true, attribution: esri },
        ],
      })
    ).toEqual([esri, 'Contains modified Copernicus Sentinel data 2026'])
    expect(collectAttributions({})).toEqual([])
  })

  test('formats the stamp coordinates in Lat, Lon', () => {
    expect(formatStampCoordinates({ lat: 41.9, lng: 12.5 })).toBe(formatCoordinates(41.9, 12.5, 'latLon'))
    expect(formatStampCoordinates(null)).toBe('')
    expect(formatStampCoordinates({ lat: Number.NaN, lng: 1 })).toBe('')
  })

  test('puts plot, date and coordinates left, base map and attributions right', () => {
    expect(
      buildStampLines({
        plotLabel: 'Cluster 2',
        dateText: '2026-10-11',
        coordinatesText: '41.9, 12.5',
        baseMapName: 'ESRI World Imagery (satellite)',
        attributions: ['© Esri', 'Copernicus'],
      })
    ).toEqual({
      left: ['Cluster 2 · 2026-10-11', '41.9, 12.5'],
      right: ['ESRI World Imagery (satellite)', '© Esri · Copernicus'],
    })
  })

  test('shows only the date without a plot and drops empty lines', () => {
    expect(buildStampLines({ plotLabel: null, dateText: '2026-10-11', baseMapName: null })).toEqual({
      left: ['2026-10-11'],
      right: [],
    })
  })

  test('names the base map by its label, else by its name', () => {
    expect(getBaseMapName({ name: 'custom:1f2e', label: 'My WMTS' })).toBe('My WMTS')
    expect(getBaseMapName({ name: 'ESRI Topographic' })).toBe('ESRI Topographic')
    expect(getBaseMapName(null)).toBe('')
  })
})
