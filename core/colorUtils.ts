const HEX_COLOR_REGEXP = /^#[0-9a-f]{6}$/i

/**
 * Tells whether the value is a #rrggbb color (case insensitive).
 * @returns {boolean} True for #rrggbb colors.
 */
export const isHexColor = (value: unknown): value is string => typeof value === 'string' && HEX_COLOR_REGEXP.test(value)
