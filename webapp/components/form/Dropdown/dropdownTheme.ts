import type { Theme } from 'react-select'

import { themeColors } from '@webapp/theme/tokens'

// react-select colors mapped to the theme tokens (CSS variables), so the dropdowns follow the active theme
const dropdownThemeColors: Theme['colors'] = {
  primary: themeColors.primary,
  primary75: themeColors.primaryContainerHigh,
  primary50: themeColors.primaryContainer,
  primary25: themeColors.primaryContainerLow,
  danger: themeColors.error,
  dangerLight: themeColors.errorContainer,
  neutral0: themeColors.surface,
  neutral5: themeColors.background,
  neutral10: themeColors.surfaceVariant,
  neutral20: themeColors.outline,
  neutral30: `color-mix(in srgb, ${themeColors.outline}, ${themeColors.onSurface} 30%)`,
  neutral40: themeColors.onSurfaceVariant,
  neutral50: themeColors.onSurfaceVariant,
  neutral60: themeColors.onSurfaceVariant,
  neutral70: themeColors.onSurface,
  neutral80: themeColors.onSurface,
  neutral90: themeColors.onSurface,
}

/**
 * Applies the Arena theme colors to the react-select default theme.
 *
 * @param {Theme} theme - The react-select default theme.
 * @returns {Theme} The theme with the Arena colors.
 */
export const dropdownTheme = (theme: Theme): Theme => ({
  ...theme,
  colors: { ...theme.colors, ...dropdownThemeColors },
})
