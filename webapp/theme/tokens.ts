/**
 * Arena design tokens.
 * Color names follow the Material Design 3 / React Native Paper conventions; values mirror `webapp/style/themes.scss`.
 */
export const themeModes = {
  light: 'light',
  dark: 'dark',
} as const

export type ThemeMode = (typeof themeModes)[keyof typeof themeModes]

export type ArenaPalette = {
  primary: string
  onPrimary: string
  primaryContainer: string
  primaryContainerLow: string
  primaryContainerHigh: string
  onPrimaryContainer: string
  secondary: string
  onSecondary: string
  secondaryContainer: string
  onSecondaryContainer: string
  background: string
  onBackground: string
  surface: string
  onSurface: string
  surfaceVariant: string
  onSurfaceVariant: string
  surfaceDisabled: string
  inverseSurface: string
  inverseOnSurface: string
  outline: string
  error: string
  onError: string
  errorContainer: string
  success: string
  onSuccess: string
  successContainer: string
  warning: string
  onWarning: string
  warningContainer: string
  highlight: string
  highlightContainer: string
  shadow: string
}

const lightPalette: ArenaPalette = {
  primary: '#3885ca',
  onPrimary: '#ffffff',
  primaryContainer: '#c3daef',
  primaryContainerLow: '#edf4fa',
  primaryContainerHigh: '#9bc2e4',
  onPrimaryContainer: '#225079',
  secondary: '#5b6b7d',
  onSecondary: '#ffffff',
  secondaryContainer: '#e7e9ee',
  onSecondaryContainer: '#2f3138',
  background: '#f6f7f9',
  onBackground: '#2f3138',
  surface: '#ffffff',
  onSurface: '#2f3138',
  surfaceVariant: '#e7e9ee',
  onSurfaceVariant: '#62666f',
  surfaceDisabled: '#c3c7d0',
  inverseSurface: '#2f3138',
  inverseOnSurface: '#ffffff',
  outline: '#d1d1dd',
  error: '#ed5b46',
  onError: '#ffffff',
  errorContainer: '#f7dfe3',
  success: '#84ac67',
  onSuccess: '#ffffff',
  successContainer: '#f0f2e7',
  warning: '#eba444',
  onWarning: '#ffffff',
  warningContainer: '#f9ccb2',
  highlight: '#fee997',
  highlightContainer: '#f8f6cc',
  shadow: '#2f3138',
}

const darkPalette: ArenaPalette = {
  primary: '#4a94d6',
  onPrimary: '#ffffff',
  primaryContainer: '#2c445c',
  primaryContainerLow: '#232c38',
  primaryContainerHigh: '#345b7f',
  onPrimaryContainer: '#92bfe6',
  secondary: '#9aa8b8',
  onSecondary: '#16181d',
  secondaryContainer: '#2d3139',
  onSecondaryContainer: '#e3e5ea',
  background: '#16181d',
  onBackground: '#e3e5ea',
  surface: '#1f2228',
  onSurface: '#e3e5ea',
  surfaceVariant: '#2d3139',
  onSurfaceVariant: '#a9aeb9',
  surfaceDisabled: '#4a4f5a',
  inverseSurface: '#3a3f49',
  inverseOnSurface: '#f2f3f5',
  outline: '#3e434d',
  error: '#f07462',
  onError: '#ffffff',
  errorContainer: '#4d2a2a',
  success: '#93bb76',
  onSuccess: '#16181d',
  successContainer: '#2b3526',
  warning: '#f0b25e',
  onWarning: '#16181d',
  warningContainer: '#4d3826',
  highlight: '#6b5d22',
  highlightContainer: '#3d3a22',
  shadow: '#000000',
}

export const themePalettes: Record<ThemeMode, ArenaPalette> = {
  light: lightPalette,
  dark: darkPalette,
}

const toCssVarName = (key: string): string => `--color-${key.replaceAll(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`

/**
 * References to the theme CSS custom properties (e.g. `themeColors.primary` = `var(--color-primary)`).
 * Use them in inline styles / `sx` props so colors follow the active theme.
 */
export const themeColors = Object.fromEntries(
  Object.keys(lightPalette).map((key) => [key, `var(${toCssVarName(key)})`])
) as Record<keyof ArenaPalette, string>

export const defaultTokens = {
  typography: {
    fontFamily: "'Noto Sans', sans-serif",
  },
  colors: lightPalette,
} as const

export type ArenaTokens = typeof defaultTokens
