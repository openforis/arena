import { extractAttributeValue } from '@server/modules/odkImport/service/odkImport/dataImportJobs/odkAttributeValueExtractor'

const geoNodeDef = { type: 'geo' }

const extractGeo = (rawText: string) =>
  extractAttributeValue({
    survey: {},
    nodeDef: geoNodeDef,
    categoryItemProvider: { getItemByCode: async () => null },
    rawText,
    tx: null,
  })

describe('odkAttributeValueExtractor / geotrace-geoshape', () => {
  test('an open path of points (geotrace) becomes a GeoJSON LineString', async () => {
    const rawText = '44.4938 11.3387 0 0;44.4950 11.3400 0 0;44.4960 11.3420 0 0'
    const value = await extractGeo(rawText)
    expect(value).toEqual({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [11.3387, 44.4938],
          [11.34, 44.495],
          [11.342, 44.496],
        ],
      },
      properties: {},
    })
  })

  test('a closed ring of at least 4 points (geoshape) becomes a GeoJSON Polygon', async () => {
    const rawText = '44.49 11.33 0 0;44.50 11.34 0 0;44.51 11.35 0 0;44.49 11.33 0 0' // first === last
    const value = await extractGeo(rawText)
    expect(value.geometry.type).toBe('Polygon')
    expect(value.geometry.coordinates).toEqual([
      [
        [11.33, 44.49],
        [11.34, 44.5],
        [11.35, 44.51],
        [11.33, 44.49],
      ],
    ])
  })

  test('a 3-point path that happens to close is NOT treated as a polygon (fewer than 4 points)', async () => {
    // first === last, but only 3 points total - too short to be a valid closed ring/meaningful shape
    const rawText = '44.49 11.33 0 0;44.50 11.34 0 0;44.49 11.33 0 0'
    const value = await extractGeo(rawText)
    expect(value.geometry.type).toBe('LineString')
  })

  test('a single point is not enough to build any geometry', async () => {
    const value = await extractGeo('44.49 11.33 0 0')
    expect(value).toBeNull()
  })

  test('empty text returns null', async () => {
    const value = await extractGeo('')
    expect(value).toBeNull()
  })
})
