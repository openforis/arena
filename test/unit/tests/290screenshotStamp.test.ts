import { formatCoordinates } from '@webapp/components/MapContainer/workspace/statusbar/coordinateFormat'
import {
  buildStampLines,
  collectAttributions,
  formatStampCoordinates,
  stripHtml,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotStamp'

const esri = '&copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community'

describe('Screenshot stamp (290)', () => {
  test('turns an HTML attribution into plain text', () => {
    expect(stripHtml('Map data &copy; <a href="https://www.un.org/geospatial/">United Nations</a>')).toBe(
      'Map data © United Nations'
    )
    expect(stripHtml('A &amp;lt;b&amp;gt; &mdash;&nbsp;B')).toBe('A &lt;b&gt; — B')
    expect(stripHtml(null)).toBe('')
  })

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
    ).toEqual([
      '© Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      'Contains modified Copernicus Sentinel data 2026',
    ])
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
})
