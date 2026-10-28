import { getAreaOfInterestSummary, parseAreaOfInterest } from '@core/geo/areaOfInterestParser'

const ring1 = [
  [12.4, 41.8],
  [12.6, 41.8],
  [12.6, 42.0],
  [12.4, 42.0],
  [12.4, 41.8],
]
const ring2 = [
  [13, 41.8],
  [13.2, 41.8],
  [13.2, 42],
  [13, 42],
  [13, 41.8],
]
const polygon = { type: 'Polygon', coordinates: [ring1] }
const multiPolygon = { type: 'MultiPolygon', coordinates: [[ring1], [ring2]] }
const feature = (geometry: unknown) => ({ type: 'Feature', properties: {}, geometry })

describe('Area of interest parser', () => {
  test('polygon geometry', () => {
    expect(parseAreaOfInterest(polygon)).toEqual(polygon)
  })

  test('multi polygon geometry', () => {
    expect(parseAreaOfInterest(multiPolygon)).toEqual(multiPolygon)
  })

  test('feature', () => {
    expect(parseAreaOfInterest(feature(polygon))).toEqual(polygon)
  })

  test('feature collection: polygons merged into a multi polygon, other geometries ignored', () => {
    const featureCollection = {
      type: 'FeatureCollection',
      features: [
        feature(polygon),
        feature({ type: 'Point', coordinates: [12.5, 41.9] }),
        feature({ type: 'Polygon', coordinates: [ring2] }),
      ],
    }
    expect(parseAreaOfInterest(featureCollection)).toEqual(multiPolygon)
  })

  test('feature collection with a single polygon => polygon', () => {
    expect(parseAreaOfInterest({ type: 'FeatureCollection', features: [feature(polygon)] })).toEqual(polygon)
  })

  test('invalid input => null', () => {
    expect(parseAreaOfInterest(null)).toBeNull()
    expect(parseAreaOfInterest('text')).toBeNull()
    expect(parseAreaOfInterest({ type: 'Point', coordinates: [12.5, 41.9] })).toBeNull()
    expect(parseAreaOfInterest({ type: 'Polygon', coordinates: [] })).toBeNull()
    // ring with less than 4 positions
    expect(parseAreaOfInterest({ type: 'Polygon', coordinates: [ring1.slice(0, 3)] })).toBeNull()
    // coordinates out of range (not WGS84)
    expect(
      parseAreaOfInterest({ type: 'Polygon', coordinates: [ring1.map(([x, y]) => [x * 1000, y * 1000])] })
    ).toBeNull()
    expect(parseAreaOfInterest({ type: 'FeatureCollection', features: [] })).toBeNull()
  })

  test('summary', () => {
    expect(getAreaOfInterestSummary(multiPolygon as any)).toEqual({ polygons: 2, vertices: 10 })
  })
})
