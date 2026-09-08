import {
  DEFAULT_BLEND_ZOOM_RANGE,
  blendCountryFeatureCollection,
  blendLonLat,
  getBlendFactor,
} from '@core/geo/equalEarthBlend'

describe('equalEarthBlend', () => {
  test('getBlendFactor is 1 at or below the start zoom', () => {
    expect(getBlendFactor(0, { start: 1, end: 4 })).toBe(1)
    expect(getBlendFactor(1, { start: 1, end: 4 })).toBe(1)
  })

  test('getBlendFactor is 0 at or above the end zoom', () => {
    expect(getBlendFactor(4, { start: 1, end: 4 })).toBe(0)
    expect(getBlendFactor(10, { start: 1, end: 4 })).toBe(0)
  })

  test('getBlendFactor interpolates linearly in between', () => {
    expect(getBlendFactor(2.5, { start: 1, end: 4 })).toBeCloseTo(0.5)
  })

  test('DEFAULT_BLEND_ZOOM_RANGE is zoom 1 to 4', () => {
    expect(DEFAULT_BLEND_ZOOM_RANGE).toEqual({ start: 1, end: 4 })
  })

  test('blendLonLat at blend=0 returns the true position unchanged', () => {
    expect(blendLonLat({ lon: 45, lat: 45 }, 0)).toEqual({ lon: 45, lat: 45 })
  })

  test('blendLonLat at blend=1 returns the fully warped position', () => {
    const result = blendLonLat({ lon: 45, lat: 45 }, 1)
    expect(result.lon).toBeCloseTo(33.227383823930545, 6)
    expect(result.lat).toBeCloseTo(44.13702534320391, 6)
  })

  test('blendCountryFeatureCollection blends every coordinate in every feature, leaving structure and properties intact', () => {
    const trueData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { admin: 'XYZ', mapcolor7: 3 },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [45, 45],
                [0, 0],
              ],
            ],
          },
        },
      ],
    }
    const blended = blendCountryFeatureCollection(trueData, 1)
    expect(blended.features[0].properties).toEqual({ admin: 'XYZ', mapcolor7: 3 })
    expect(blended.features[0].geometry.type).toBe('Polygon')
    expect(blended.features[0].geometry.coordinates[0][0][0]).toBeCloseTo(33.227383823930545, 6)
    expect(blended.features[0].geometry.coordinates[0][0][1]).toBeCloseTo(44.13702534320391, 6)
    expect(blended.features[0].geometry.coordinates[0][1]).toEqual([0, 0])
  })
})
