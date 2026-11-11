import type { SceneBandMix } from './sceneTypes'

// Sentinel-2 L2A, processing baseline ≥ 04.00 (Earth Search c1): reflectance = DN × 0.0001 − 0.1.
export const SCENE_REFLECTANCE_SCALE = 0.0001
export const SCENE_REFLECTANCE_OFFSET = -0.1

type ReflectanceBandMix = Exclude<SceneBandMix, 'trueColour'>
type RgbStretch = [number, number, number]

// Reflectance shown as full intensity, per output channel (red, green, blue).
export const SCENE_STRETCH_MAX: Record<ReflectanceBandMix, RgbStretch> = {
  falseColourVegetation: [0.45, 0.2, 0.2],
  swir: [0.35, 0.45, 0.25],
}

export type PixelToColor = (values: number[]) => string | null

/**
 * Tells whether a band value is nodata (0) or missing.
 *
 * @param {number|undefined} value - Band value.
 * @returns {boolean} True for nodata.
 */
const isNoData = (value: number | undefined): boolean => value === undefined || value === 0

/**
 * Rounds and clamps a value to a byte; non-finite values become 0.
 *
 * @param {number} value - Value.
 * @returns {number} Byte 0–255.
 */
const toByte = (value: number): number => (Number.isFinite(value) ? Math.min(255, Math.max(0, Math.round(value))) : 0)

/**
 * Formats a byte as two hex digits.
 *
 * @param {number} byte - Byte.
 * @returns {string} Hex digits.
 */
const toHex = (byte: number): string => byte.toString(16).padStart(2, '0')

/**
 * Colours a TCI pixel (uint8 RGB); black (0, 0, 0) is nodata and stays transparent.
 *
 * @param {number[]} values - Pixel values [red, green, blue].
 * @returns {string|null} CSS colour, or null for nodata.
 */
export const tciPixelToColor: PixelToColor = (values) => {
  const [red, green, blue] = values
  if (isNoData(red) && isNoData(green) && isNoData(blue)) return null
  return `#${toHex(toByte(red ?? 0))}${toHex(toByte(green ?? 0))}${toHex(toByte(blue ?? 0))}`
}

/**
 * Converts a digital number to a byte, stretching reflectance 0–max to 0–255.
 *
 * @param {number} dn - Digital number (uint16).
 * @param {number} max - Reflectance shown as 255.
 * @returns {number} Byte.
 */
export const reflectanceToByte = (dn: number, max: number): number =>
  toByte(((dn * SCENE_REFLECTANCE_SCALE + SCENE_REFLECTANCE_OFFSET) / max) * 255)

/**
 * Creates the colour function of a three-band reflectance mix.
 *
 * @param {RgbStretch} max - Reflectance shown as full intensity, per channel.
 * @returns {PixelToColor} Colour function; null when any band is nodata.
 */
export const createReflectancePixelToColor =
  (max: RgbStretch): PixelToColor =>
  (values) => {
    const [red, green, blue] = values
    if (isNoData(red) || isNoData(green) || isNoData(blue)) return null
    return `#${toHex(reflectanceToByte(red, max[0]))}${toHex(reflectanceToByte(green, max[1]))}${toHex(reflectanceToByte(blue, max[2]))}`
  }

/**
 * Returns the colour function of a band mix.
 *
 * @param {SceneBandMix} bandMix - Band mix.
 * @returns {PixelToColor} Colour function.
 */
export const getScenePixelToColor = (bandMix: SceneBandMix): PixelToColor =>
  bandMix === 'trueColour' ? tciPixelToColor : createReflectancePixelToColor(SCENE_STRETCH_MAX[bandMix])
