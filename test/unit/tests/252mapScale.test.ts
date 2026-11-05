import {
  countPointsInBounds,
  getScaleBar,
  isLngInRange,
  metersPerPixel,
} from '@webapp/components/MapContainer/workspace/statusbar/mapScale'

describe('Map scale and records in view (252)', () => {
  test('metersPerPixel follows Web Mercator', () => {
    expect(metersPerPixel(0, 0)).toBeCloseTo(156543.0339, 3)
    expect(metersPerPixel(60, 0)).toBeCloseTo(156543.0339 / 2, 3)
  })

  test.each([
    [0, 0, 10000000, 64, '10000 km'],
    [0, 16, 200, 84, '200 m'],
    [60, 10, 5000, 65, '5 km'],
    [41.9, 17, 50, 56, '50 m'],
    [89.9, 3, 2000, 59, '2 km'],
  ])('getScaleBar at lat %p zoom %p is %p m (%p px)', (lat, zoom, meters, widthPx, label) => {
    expect(getScaleBar(metersPerPixel(lat, zoom))).toEqual({ meters, widthPx, label })
  })

  test('getScaleBar picks 1, 2 or 5 × 10^k that fits the width', () => {
    expect(getScaleBar(10, 100)).toEqual({ meters: 1000, widthPx: 100, label: '1 km' })
    expect(getScaleBar(0.004, 100)).toEqual({ meters: 0.2, widthPx: 50, label: '0.2 m' })
  })

  test('getScaleBar is null for an invalid resolution or width', () => {
    expect(getScaleBar(0)).toBeNull()
    expect(getScaleBar(-1)).toBeNull()
    expect(getScaleBar(Number.NaN)).toBeNull()
    expect(getScaleBar(1, 0)).toBeNull()
  })

  test('isLngInRange handles ranges across the antimeridian and the whole world', () => {
    expect(isLngInRange(175, 170, 190)).toBe(true)
    expect(isLngInRange(-175, 170, 190)).toBe(true)
    expect(isLngInRange(0, 170, 190)).toBe(false)
    expect(isLngInRange(10, -200, -150)).toBe(false)
    expect(isLngInRange(10, -180, 180)).toBe(true)
    expect(isLngInRange(-30, -40, -20)).toBe(true)
    expect(isLngInRange(100, -400, 0)).toBe(true)
  })

  test('countPointsInBounds counts points inside, also across the antimeridian', () => {
    const points = [
      { lat: 10, lng: 175 },
      { lat: 10, lng: -175 },
      { lat: 10, lng: 0 },
      { lat: 50, lng: 175 },
    ]
    expect(countPointsInBounds(points, { south: 0, west: 170, north: 20, east: 190 })).toBe(2)
    expect(countPointsInBounds([], { south: 0, west: 0, north: 1, east: 1 })).toBe(0)
  })
})
