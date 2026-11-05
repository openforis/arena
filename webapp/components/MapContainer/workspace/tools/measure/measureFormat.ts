import type {
  FormattedMeasure,
  MeasureAreaUnit,
  MeasureDistanceUnit,
  MeasureMode,
  MeasureSummary,
  MeasureUnit,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureTypes'

export const DISTANCE_KM_MIN_METERS = 1000
export const AREA_HA_MIN_SQUARE_METERS = 10_000
export const AREA_KM2_MIN_SQUARE_METERS = 100_000_000

// size of one unit in meters (distance) or square meters (area)
const UNIT_FACTORS: Record<MeasureUnit, number> = { m: 1, km: 1000, m2: 1, ha: 10_000, km2: 1_000_000 }

export type MeasureTexts = { total: string | null; perimeter: string | null }

export type MeasureTextsParams = {
  mode: MeasureMode
  summary: MeasureSummary
  distanceUnit: MeasureDistanceUnit
  areaUnit: MeasureAreaUnit
  unitLabel: (unit: MeasureUnit) => string
}

/**
 * Formats a measured value with locale-free rules: fewer decimals for bigger values.
 * @param {number} value - The value in the display unit.
 * @returns {string} The value with 0 (≥ 100), 1 (≥ 10), 2 (≥ 1) or 3 decimals; "0" for 0, negative or NaN.
 */
export const formatMeasureNumber = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return '0'
  if (value >= 100) return value.toFixed(0)
  if (value >= 10) return value.toFixed(1)
  if (value >= 1) return value.toFixed(2)
  return value.toFixed(3)
}

/**
 * Resolves the distance unit to display.
 * @param {number} meters - The distance in meters.
 * @param {MeasureDistanceUnit} unit - The chosen unit ('auto' picks m below 1 km, else km).
 * @returns {'m'|'km'} The display unit.
 */
export const resolveDistanceUnit = (meters: number, unit: MeasureDistanceUnit): 'm' | 'km' => {
  if (unit !== 'auto') return unit
  return meters < DISTANCE_KM_MIN_METERS ? 'm' : 'km'
}

/**
 * Resolves the area unit to display.
 * @param {number} squareMeters - The area in square meters.
 * @param {MeasureAreaUnit} unit - The chosen unit ('auto' picks m² below 1 ha, ha below 100 km², else km²).
 * @returns {'m2'|'ha'|'km2'} The display unit.
 */
export const resolveAreaUnit = (squareMeters: number, unit: MeasureAreaUnit): 'm2' | 'ha' | 'km2' => {
  if (unit !== 'auto') return unit
  if (squareMeters < AREA_HA_MIN_SQUARE_METERS) return 'm2'
  return squareMeters < AREA_KM2_MIN_SQUARE_METERS ? 'ha' : 'km2'
}

/**
 * Converts a base value (m or m²) into a unit and formats it.
 * @param {number} baseValue - The value in meters or square meters.
 * @param {MeasureUnit} unit - The display unit.
 * @returns {FormattedMeasure} The formatted value and its unit.
 */
const formatInUnit = (baseValue: number, unit: MeasureUnit): FormattedMeasure => ({
  value: formatMeasureNumber(baseValue / UNIT_FACTORS[unit]),
  unit,
})

/**
 * Formats a distance.
 * @param {number} meters - The distance in meters.
 * @param {MeasureDistanceUnit} unit - The chosen unit.
 * @returns {FormattedMeasure} The formatted value and its unit.
 */
export const formatDistance = (meters: number, unit: MeasureDistanceUnit): FormattedMeasure =>
  formatInUnit(meters, resolveDistanceUnit(meters, unit))

/**
 * Formats an area.
 * @param {number} squareMeters - The area in square meters.
 * @param {MeasureAreaUnit} unit - The chosen unit.
 * @returns {FormattedMeasure} The formatted value and its unit.
 */
export const formatArea = (squareMeters: number, unit: MeasureAreaUnit): FormattedMeasure =>
  formatInUnit(squareMeters, resolveAreaUnit(squareMeters, unit))

/**
 * Builds the texts of the measure bar: the total and, in Area mode, the perimeter.
 * @param {MeasureTextsParams} params - Mode, summary, chosen units and the translated unit symbol getter.
 * @returns {MeasureTexts} The texts, null when there is nothing to show.
 */
export const formatMeasureTexts = (params: MeasureTextsParams): MeasureTexts => {
  const { mode, summary, distanceUnit, areaUnit, unitLabel } = params
  /**
   * Appends the translated unit symbol to a formatted value.
   * @param {FormattedMeasure} measure - The formatted value and its unit.
   * @returns {string} The value followed by the unit symbol.
   */
  const withLabel = ({ value, unit }: FormattedMeasure): string => `${value} ${unitLabel(unit)}`
  const lengthText = summary.length === null ? null : withLabel(formatDistance(summary.length, distanceUnit))
  if (mode === 'distance') return { total: lengthText, perimeter: null }
  const areaText = summary.area === null ? null : withLabel(formatArea(summary.area, areaUnit))
  return { total: areaText, perimeter: lengthText }
}
