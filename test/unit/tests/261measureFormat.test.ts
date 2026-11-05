import {
  formatArea,
  formatDistance,
  formatMeasureNumber,
  formatMeasureTexts,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureFormat'
import type { MeasureUnit } from '@webapp/components/MapContainer/workspace/tools/measure/measureTypes'

/**
 * Fake unit label that makes the unit visible in the expected texts.
 * @param {MeasureUnit} unit - The unit.
 * @returns {string} The unit between angle brackets.
 */
const unitLabel = (unit: MeasureUnit): string => `<${unit}>`

describe('Map measure formatting (261)', () => {
  describe('formatMeasureNumber', () => {
    test.each([
      [0, '0'],
      [Number.NaN, '0'],
      [-5, '0'],
      [0.5, '0.500'],
      [0.012, '0.012'],
      [5.5, '5.50'],
      [12.34, '12.3'],
      [456.4, '456'],
      [1840, '1840'],
    ])('formats %p as %p', (value, expected) => {
      expect(formatMeasureNumber(value)).toBe(expected)
    })
  })

  describe('formatDistance', () => {
    test('automatic uses meters below 1 km', () => {
      expect(formatDistance(999, 'auto')).toEqual({ value: '999', unit: 'm' })
      expect(formatDistance(12.34, 'auto')).toEqual({ value: '12.3', unit: 'm' })
    })

    test('automatic uses kilometers from 1 km', () => {
      expect(formatDistance(1000, 'auto')).toEqual({ value: '1.00', unit: 'km' })
      expect(formatDistance(1840, 'auto')).toEqual({ value: '1.84', unit: 'km' })
    })

    test('an explicit unit wins', () => {
      expect(formatDistance(12, 'km')).toEqual({ value: '0.012', unit: 'km' })
      expect(formatDistance(111195.08, 'm')).toEqual({ value: '111195', unit: 'm' })
    })
  })

  describe('formatArea', () => {
    test('automatic uses square meters below 1 ha', () => {
      expect(formatArea(850, 'auto')).toEqual({ value: '850', unit: 'm2' })
      expect(formatArea(9999, 'auto')).toEqual({ value: '9999', unit: 'm2' })
    })

    test('automatic uses hectares from 1 ha to below 100 km²', () => {
      expect(formatArea(10_000, 'auto')).toEqual({ value: '1.00', unit: 'ha' })
      expect(formatArea(126_000, 'auto')).toEqual({ value: '12.6', unit: 'ha' })
      expect(formatArea(50_000_000, 'auto')).toEqual({ value: '5000', unit: 'ha' })
    })

    test('automatic uses square kilometers from 100 km²', () => {
      expect(formatArea(100_000_000, 'auto')).toEqual({ value: '100', unit: 'km2' })
    })

    test('an explicit unit wins', () => {
      expect(formatArea(1236434.58, 'm2')).toEqual({ value: '1236435', unit: 'm2' })
      expect(formatArea(1236434.58, 'ha')).toEqual({ value: '124', unit: 'ha' })
      expect(formatArea(1236434.58, 'km2')).toEqual({ value: '1.24', unit: 'km2' })
    })
  })

  describe('formatMeasureTexts', () => {
    test('distance shows the length and no perimeter', () => {
      const texts = formatMeasureTexts({
        mode: 'distance',
        summary: { length: 1840, area: null },
        distanceUnit: 'auto',
        areaUnit: 'auto',
        unitLabel,
      })
      expect(texts).toEqual({ total: '1.84 <km>', perimeter: null })
    })

    test('distance without a length shows nothing', () => {
      const texts = formatMeasureTexts({
        mode: 'distance',
        summary: { length: null, area: null },
        distanceUnit: 'auto',
        areaUnit: 'auto',
        unitLabel,
      })
      expect(texts).toEqual({ total: null, perimeter: null })
    })

    test('area shows the area and the perimeter in the distance unit', () => {
      const texts = formatMeasureTexts({
        mode: 'area',
        summary: { length: 1480, area: 126_000 },
        distanceUnit: 'auto',
        areaUnit: 'auto',
        unitLabel,
      })
      expect(texts).toEqual({ total: '12.6 <ha>', perimeter: '1.48 <km>' })
    })

    test('area without an area shows nothing', () => {
      const texts = formatMeasureTexts({
        mode: 'area',
        summary: { length: null, area: null },
        distanceUnit: 'm',
        areaUnit: 'ha',
        unitLabel,
      })
      expect(texts).toEqual({ total: null, perimeter: null })
    })
  })
})
