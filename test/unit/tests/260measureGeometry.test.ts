import {
  measureArea,
  measureLength,
  measurePerimeter,
  toLatLngPairs,
  toOpenRing,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureGeometry'
import type { LatLngPair } from '@webapp/components/MapContainer/workspace/tools/measure/measureTypes'

// 0.01° square and right triangle at the equator
const SQUARE: LatLngPair[] = [
  [0, 0],
  [0, 0.01],
  [0.01, 0.01],
  [0.01, 0],
]
const TRIANGLE: LatLngPair[] = [
  [0, 0],
  [0, 0.01],
  [0.01, 0],
]

describe('Map measure geometry (260)', () => {
  describe('toLatLngPairs', () => {
    test('converts one LatLng', () => {
      expect(toLatLngPairs({ lat: 1, lng: 2 })).toEqual([[1, 2]])
    })

    test('converts a list of LatLng', () => {
      expect(
        toLatLngPairs([
          { lat: 1, lng: 2 },
          { lat: 3, lng: 4 },
        ])
      ).toEqual([
        [1, 2],
        [3, 4],
      ])
    })

    test('takes the outer ring of polygon rings', () => {
      expect(
        toLatLngPairs([
          [
            { lat: 1, lng: 2 },
            { lat: 3, lng: 4 },
          ],
          [{ lat: 9, lng: 9 }],
        ])
      ).toEqual([
        [1, 2],
        [3, 4],
      ])
    })

    test('skips invalid entries and inputs', () => {
      expect(
        toLatLngPairs([
          { lat: Number.NaN, lng: 1 },
          { lat: 1, lng: 2 },
        ])
      ).toEqual([[1, 2]])
      expect(toLatLngPairs(null)).toEqual([])
      expect(toLatLngPairs(undefined)).toEqual([])
      expect(toLatLngPairs('x')).toEqual([])
    })
  })

  describe('toOpenRing', () => {
    test('drops repeated vertices and the closing vertex', () => {
      expect(
        toOpenRing([
          [0, 0],
          [0, 0],
          [0, 1],
          [1, 1],
          [0, 0],
        ])
      ).toEqual([
        [0, 0],
        [0, 1],
        [1, 1],
      ])
    })
  })

  describe('measureLength', () => {
    test('measures one degree of longitude at the equator', () => {
      expect(
        measureLength([
          [0, 0],
          [0, 1],
        ])
      ).toBeCloseTo(111195.08, 1)
    })

    test('sums the segments of a path', () => {
      expect(
        measureLength([
          [0, 0],
          [0, 0.01],
          [0.01, 0.01],
        ])
      ).toBeCloseTo(2223.9, 1)
    })

    test('ignores repeated vertices', () => {
      expect(
        measureLength([
          [0, 0],
          [0, 0],
          [0, 1],
        ])
      ).toBeCloseTo(111195.08, 1)
    })

    test('is 0 with fewer than 2 vertices', () => {
      expect(measureLength([[0, 0]])).toBe(0)
      expect(measureLength([])).toBe(0)
    })
  })

  describe('measureArea', () => {
    test('measures a square', () => {
      expect(measureArea(SQUARE)).toBeCloseTo(1236434.58, 1)
    })

    test('does not depend on the drawing direction', () => {
      expect(measureArea([...SQUARE].reverse())).toBeCloseTo(1236434.58, 1)
    })

    test('gives the same area for an explicitly closed ring', () => {
      expect(measureArea([...SQUARE, SQUARE[0]])).toBeCloseTo(1236434.58, 1)
    })

    test('measures a triangle', () => {
      expect(measureArea(TRIANGLE)).toBeCloseTo(618217.29, 1)
    })

    test('has no area with fewer than 3 distinct vertices', () => {
      expect(
        measureArea([
          [0, 0],
          [0, 0.01],
        ])
      ).toBeNull()
      expect(
        measureArea([
          [0, 0],
          [0, 0.01],
          [0, 0.01],
        ])
      ).toBeNull()
      expect(
        measureArea([
          [0, 0],
          [0, 0.01],
          [0, 0],
        ])
      ).toBeNull()
      expect(measureArea([])).toBeNull()
    })
  })

  describe('measurePerimeter', () => {
    test('measures the closed ring of a square', () => {
      expect(measurePerimeter(SQUARE)).toBeCloseTo(4447.8, 1)
    })

    test('measures the closed ring of a triangle', () => {
      expect(measurePerimeter(TRIANGLE)).toBeCloseTo(3796.44, 1)
    })

    test('has no perimeter with fewer than 3 distinct vertices', () => {
      expect(
        measurePerimeter([
          [0, 0],
          [0, 0.01],
        ])
      ).toBeNull()
    })
  })
})
