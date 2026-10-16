/**
 * Arena design tokens.
 * Color names follow the Material Design 3 conventions; values mirror `webapp/style/themes.scss`.
 */
export const themeModes = {
  light: 'light',
  dark: 'dark',
} as const

export type ThemeMode = (typeof themeModes)[keyof typeof themeModes]

// [light, dark] value of each color token
const colorTokenValues = {
  primary: ['#3885ca', '#4a94d6'],
  onPrimary: ['#ffffff', '#ffffff'],
  primaryContainer: ['#c3daef', '#2c445c'],
  primaryContainerLow: ['#edf4fa', '#232c38'],
  primaryContainerHigh: ['#9bc2e4', '#345b7f'],
  onPrimaryContainer: ['#225079', '#92bfe6'],
  secondary: ['#5b6b7d', '#9aa8b8'],
  onSecondary: ['#ffffff', '#16181d'],
  secondaryContainer: ['#e7e9ee', '#2d3139'],
  onSecondaryContainer: ['#2f3138', '#e3e5ea'],
  background: ['#f6f7f9', '#16181d'],
  onBackground: ['#2f3138', '#e3e5ea'],
  surface: ['#ffffff', '#1f2228'],
  onSurface: ['#2f3138', '#e3e5ea'],
  surfaceVariant: ['#e7e9ee', '#2d3139'],
  onSurfaceVariant: ['#62666f', '#a9aeb9'],
  surfaceDisabled: ['#c3c7d0', '#4a4f5a'],
  inverseSurface: ['#2f3138', '#3a3f49'],
  inverseOnSurface: ['#ffffff', '#f2f3f5'],
  outline: ['#d1d1dd', '#3e434d'],
  error: ['#ed5b46', '#f07462'],
  onError: ['#ffffff', '#ffffff'],
  errorContainer: ['#f7dfe3', '#4d2a2a'],
  success: ['#84ac67', '#93bb76'],
  onSuccess: ['#ffffff', '#16181d'],
  successContainer: ['#f0f2e7', '#2b3526'],
  warning: ['#eba444', '#f0b25e'],
  onWarning: ['#ffffff', '#16181d'],
  warningContainer: ['#f9ccb2', '#4d3826'],
  highlight: ['#fee997', '#6b5d22'],
  highlightContainer: ['#f8f6cc', '#3d3a22'],
  shadow: ['#2f3138', '#000000'],
} as const satisfies Record<string, readonly [string, string]>

export type ArenaColorToken = keyof typeof colorTokenValues

export type ArenaPalette = Record<ArenaColorToken, string>

const colorTokens = Object.keys(colorTokenValues) as ArenaColorToken[]

const buildPalette = (themeIndex: 0 | 1): ArenaPalette =>
  Object.fromEntries(colorTokens.map((token) => [token, colorTokenValues[token][themeIndex]])) as ArenaPalette

export const themePalettes: Record<ThemeMode, ArenaPalette> = {
  light: buildPalette(0),
  dark: buildPalette(1),
}

const toKebabCase = (value: string): string => value.replaceAll(/[A-Z]/g, (c) => '-' + c.toLowerCase())

/**
 * References to the theme CSS custom properties (e.g. `themeColors.primary` = `var(--color-primary)`).
 * Use them in inline styles / `sx` props so colors follow the active theme.
 */
export const themeColors = Object.fromEntries(
  colorTokens.map((token) => [token, `var(--color-${toKebabCase(token)})`])
) as ArenaPalette

export const defaultTokens = {
  typography: {
    fontFamily: "'Noto Sans', sans-serif",
  },
  colors: themePalettes.light,
} as const

export type ArenaTokens = typeof defaultTokens
