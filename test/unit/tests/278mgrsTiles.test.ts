/**
 * MGRS 100 km tiles covering a bounding box: zone and band edges, Norway and Svalbard exceptions,
 * antimeridian, polar limits and the search caps.
 */
import {
  getMgrsTilesForBounds,
  MAX_SCENE_TILES,
  mgrsTileAt,
  mgrsTileBounds,
  normalizeLongitude,
} from '@webapp/components/MapContainer/workspace/scenes/mgrsTiles'
import type { GeoBounds } from '@webapp/components/MapContainer/workspace/scenes/sceneTypes'

const bounds = (west: number, south: number, east: number, north: number): GeoBounds => ({ west, south, east, north })

describe('Sentinel-2 MGRS tiles (278)', () => {
  test('wraps longitudes into [-180, 180)', () => {
    expect(normalizeLongitude(180)).toBe(-180)
    expect(normalizeLongitude(-180)).toBe(-180)
    expect(normalizeLongitude(190)).toBe(-170)
    expect(normalizeLongitude(-190)).toBe(170)
    expect(normalizeLongitude(396.8)).toBeCloseTo(36.8, 6)
  })

  test('returns zero-padded tile ids like the index, or null outside UTM latitudes', () => {
    expect(mgrsTileAt(36.8, -1.3)).toBe('37MBU')
    expect(mgrsTileAt(-177, -17)).toBe('01KEB')
    expect(mgrsTileAt(396.8, -1.3)).toBe('37MBU')
    expect(mgrsTileAt(10, 85)).toBeNull()
  })

  test.each([
    ['inside one tile (Nairobi)', bounds(36.75, -1.35, 36.85, -1.25), ['37MBU']],
    ['across the 36/37 zone edge', bounds(35.95, -1.05, 36.05, -0.95), ['36MZD', '37MAU']],
    ['across the equator', bounds(36.5, -0.05, 36.6, 0.05), ['37MBV', '37NBA']],
    ['across the antimeridian, east above 180', bounds(179.95, -17.05, 180.05, -16.95), ['01KAB', '60KZG']],
    ['across the antimeridian, west below -180', bounds(-180.05, -17.05, -179.95, -16.95), ['01KAB', '60KZG']],
    ['across the antimeridian, east wrapped below west', bounds(179.95, -17.05, -179.95, -16.95), ['01KAB', '60KZG']],
    ['in zone 1 with a padded id', bounds(-178.05, -18.05, -177.95, -17.95), ['01KCA']],
    ['in the Norway exception', bounds(4.45, 60, 4.55, 60.05), ['32VKM']],
    ['in the Svalbard exception', bounds(14.95, 78, 15.05, 78.05), ['33XVG', '33XWG']],
    ['north of 84° is clamped', bounds(10, 83.5, 10.5, 85), ['33XVN', '33XVP']],
  ])('finds the tiles %s', (_name, area, tiles) => {
    expect(getMgrsTilesForBounds(area)).toEqual({ status: 'ok', tiles })
  })

  test('matches a dense grid on a North Sea area with zone 31/32 and band U/V edges', () => {
    const area = bounds(2.1, 55.2, 4.9, 57.3)
    const expected = [
      '31UDB',
      '31UDC',
      '31UEB',
      '31UEC',
      '31UFB',
      '31UFC',
      '31VDC',
      '31VDD',
      '32VJH',
      '32VJJ',
      '32VKH',
      '32VKJ',
    ]
    const dense = new Set<string>()
    for (let lat = area.south; lat <= area.north; lat += 0.02) {
      for (let lon = area.west; lon <= area.east; lon += 0.02) {
        dense.add(mgrsTileAt(lon, lat) as string)
      }
    }
    expect([...dense].sort()).toEqual(expected)
    expect(getMgrsTilesForBounds(area)).toEqual({ status: 'ok', tiles: expected })
  })

  test('caps the area at 10° and 16 tiles', () => {
    expect(MAX_SCENE_TILES).toBe(16)
    expect(getMgrsTilesForBounds(bounds(30, -5, 45, 5))).toEqual({ status: 'tooLarge' })
    expect(getMgrsTilesForBounds(bounds(35, -2, 38, 0))).toEqual({ status: 'tooLarge' })
  })

  test('world view is too large', () => {
    expect(getMgrsTilesForBounds(bounds(-180, -85, 180, 85))).toEqual({ status: 'tooLarge' })
    expect(getMgrsTilesForBounds(bounds(-400, -85, 400, 85))).toEqual({ status: 'tooLarge' })
  })

  test('areas beyond the UTM latitudes are outside', () => {
    expect(getMgrsTilesForBounds(bounds(10, 85, 11, 86))).toEqual({ status: 'outside' })
    expect(getMgrsTilesForBounds(bounds(10, -86, 11, -85))).toEqual({ status: 'outside' })
  })

  test('invalid bounds are outside', () => {
    expect(getMgrsTilesForBounds(bounds(Number.NaN, 0, 1, 1))).toEqual({ status: 'outside' })
  })

  test('returns the bounds of a tile, or null for an invalid id', () => {
    const tile = mgrsTileBounds('37MBU')
    expect(tile?.west).toBeCloseTo(36.3036, 3)
    expect(tile?.south).toBeCloseTo(-1.8074, 3)
    expect(tile?.east).toBeCloseTo(37.2027, 3)
    expect(tile?.north).toBeCloseTo(-0.9043, 3)
    expect(mgrsTileBounds('nonsense')).toBeNull()
    expect(mgrsTileBounds('')).toBeNull()
  })
})
