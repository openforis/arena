import {
  formatCoordinates,
  formatDms,
  formatUtm,
  getUtmZone,
  latLonToUtm,
  nextCoordinateNotation,
  normalizeLongitude,
  utmToLatLon,
} from '@webapp/components/MapContainer/workspace/statusbar/coordinateFormat'

// reference values computed with the Krüger series (they match PROJ to the millimetre)
const utmCases: Array<[number, number, number, string, number, number]> = [
  [-0.4231, 36.9512, 37, 'M', 271977.1088, 9953204.614],
  [0, 0, 31, 'N', 166021.4431, 0],
  [41.9028, 12.4964, 33, 'T', 292335.3131, 4642015.5],
  [-33.8688, 151.2093, 56, 'H', 334368.6337, 6250948.3454],
  [60.1699, 24.9384, 35, 'V', 385611.3167, 6672118.3803],
]

describe('Map coordinate formats (251)', () => {
  test.each(utmCases)('latLonToUtm(%p, %p) is zone %p%p', (lat, lng, zone, band, easting, northing) => {
    const utm = latLonToUtm(lat, lng)
    expect(utm?.zone).toBe(zone)
    expect(utm?.band).toBe(band)
    expect(utm?.easting).toBeCloseTo(easting, 2)
    expect(utm?.northing).toBeCloseTo(northing, 2)
  })

  test.each([
    [78.2232, 15.6267, 33, 'X'],
    [59, 5, 32, 'V'],
    [83.9, -170, 2, 'X'],
    [-79.9, 179.99, 60, 'C'],
  ])('latLonToUtm(%p, %p) handles zone exceptions and edges: %p%p', (lat, lng, zone, band) => {
    expect(latLonToUtm(lat, lng)).toMatchObject({ zone, band })
  })

  test('UTM round trips within 1e-7 degrees', () => {
    for (const [lat, lng] of [...utmCases.map(([a, b]) => [a, b]), [78.2232, 15.6267], [-79.9, 179.99]]) {
      const utm = latLonToUtm(lat, lng)
      const back =
        utm && utmToLatLon({ zone: utm.zone, southern: lat < 0, easting: utm.easting, northing: utm.northing })
      expect(back?.lat).toBeCloseTo(lat, 7)
      expect(back?.lng).toBeCloseTo(lng, 7)
    }
  })

  test('latLonToUtm is null outside 80° S–84° N and for non-finite input', () => {
    expect(latLonToUtm(84.0001, 0)).toBeNull()
    expect(latLonToUtm(-80.1, 0)).toBeNull()
    expect(latLonToUtm(Number.NaN, 0)).toBeNull()
    expect(latLonToUtm(84, 0)?.band).toBe('X')
    expect(latLonToUtm(-80, 0)?.band).toBe('C')
  })

  test('utmToLatLon rejects invalid zones', () => {
    expect(utmToLatLon({ zone: 0, southern: false, easting: 500000, northing: 0 })).toBeNull()
    expect(utmToLatLon({ zone: 61, southern: false, easting: 500000, northing: 0 })).toBeNull()
  })

  test('getUtmZone applies the Norway and Svalbard exceptions and wraps longitudes', () => {
    expect(getUtmZone(60, 5)).toBe(32)
    expect(getUtmZone(78, 8)).toBe(31)
    expect(getUtmZone(78, 10)).toBe(33)
    expect(getUtmZone(78, 25)).toBe(35)
    expect(getUtmZone(78, 40)).toBe(37)
    expect(getUtmZone(78, 45)).toBe(38)
    expect(getUtmZone(0, 180)).toBe(60)
    expect(getUtmZone(0, -180)).toBe(1)
  })

  test('normalizeLongitude wraps into -180..180 and keeps 180', () => {
    expect(normalizeLongitude(180)).toBe(180)
    expect(normalizeLongitude(-180)).toBe(-180)
    expect(normalizeLongitude(540)).toBe(180)
    expect(normalizeLongitude(-190)).toBe(170)
    expect(normalizeLongitude(190)).toBe(-170)
  })

  test('formatUtm rounds to the metre', () => {
    expect(formatUtm({ zone: 37, band: 'M', easting: 271977.1088, northing: 9953204.614 })).toBe(
      '37M 271977 E 9953205 N'
    )
  })

  test('formatDms carries rounded seconds and never shows a sign for zero', () => {
    expect(formatDms(-0.4231, 36.9512)).toBe('0°25′23″ S, 36°57′04″ E')
    expect(formatDms(0, 0)).toBe('0°00′00″ N, 0°00′00″ E')
    expect(formatDms(-0.00001, -0.00001)).toBe('0°00′00″ N, 0°00′00″ E')
    expect(formatDms(10.99999, -179.99999)).toBe('11°00′00″ N, 180°00′00″ W')
  })

  test('formatCoordinates formats each notation', () => {
    expect(formatCoordinates(-0.4231, 36.9512, 'latLon')).toBe('-0.42310, 36.95120')
    expect(formatCoordinates(-0.4231, 36.9512, 'dms')).toBe('0°25′23″ S, 36°57′04″ E')
    expect(formatCoordinates(-0.4231, 36.9512, 'utm')).toBe('37M 271977 E 9953205 N')
    expect(formatCoordinates(85, 0, 'utm')).toBe('—')
    expect(formatCoordinates(41.9, 372.5, 'latLon')).toBe('41.90000, 12.50000')
  })

  test('nextCoordinateNotation cycles Lat, Lon → DMS → UTM', () => {
    expect(nextCoordinateNotation('latLon')).toBe('dms')
    expect(nextCoordinateNotation('dms')).toBe('utm')
    expect(nextCoordinateNotation('utm')).toBe('latLon')
  })
})
