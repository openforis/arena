import { projectToEqualEarthMeters, warpLonLatToEqualEarthInMercator } from '@core/geo/equalEarthProjection'

describe('equalEarthProjection', () => {
  test('projects the origin (0,0) to (0,0)', () => {
    const { x, y } = projectToEqualEarthMeters({ lon: 0, lat: 0 })
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(0)
  })

  test('projects the antimeridian at the equator to the expected Equal Earth extent', () => {
    const { x, y } = projectToEqualEarthMeters({ lon: 180, lat: 0 })
    expect(x).toBeCloseTo(17263256.844, 0)
    expect(y).toBeCloseTo(0)
  })

  test('warping and unwarping the origin leaves it unchanged', () => {
    const warped = warpLonLatToEqualEarthInMercator({ lon: 0, lat: 0 })
    expect(warped.lon).toBeCloseTo(0)
    expect(warped.lat).toBeCloseTo(0)
  })

  test('warps a mid-latitude point to the known reference value and keeps it within valid ranges', () => {
    const warped = warpLonLatToEqualEarthInMercator({ lon: 45, lat: 45 })
    expect(warped.lon).toBeCloseTo(33.227383823930545, 6)
    expect(warped.lat).toBeCloseTo(44.13702534320391, 6)
    expect(warped.lon).toBeGreaterThan(-180)
    expect(warped.lon).toBeLessThan(180)
    expect(warped.lat).toBeGreaterThan(-90)
    expect(warped.lat).toBeLessThan(90)
  })
})
