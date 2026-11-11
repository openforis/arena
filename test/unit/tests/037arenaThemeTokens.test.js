import { buildCssVarMap } from '@webapp/theme/applyCssVars'
import { createArenaTheme } from '@webapp/theme/createArenaTheme'
import { resolveThemeMode, themePreferences } from '@webapp/theme/themeMode'
import { themeColors, themePalettes } from '@webapp/theme/tokens'

describe('buildCssVarMap', () => {
  it('removes the primary color override when no survey primary color is set', () => {
    const map = buildCssVarMap()
    expect(map['--color-primary']).toBeNull()
  })

  it('overrides the primary color with the survey one when provided', () => {
    const primaryColor = '#112233'
    const map = buildCssVarMap({ primaryColor })
    expect(map['--color-primary']).toBe(primaryColor)
  })
})

describe('themeColors', () => {
  it('references the theme CSS custom properties', () => {
    expect(themeColors.primary).toBe('var(--color-primary)')
    expect(themeColors.onPrimaryContainer).toBe('var(--color-on-primary-container)')
    expect(themeColors.surfaceVariant).toBe('var(--color-surface-variant)')
  })

  it('defines the same tokens in every theme', () => {
    expect(Object.keys(themePalettes.dark).sort()).toEqual(Object.keys(themePalettes.light).sort())
  })
})

describe('createArenaTheme', () => {
  it('creates a light theme by default', () => {
    const theme = createArenaTheme()
    expect(theme.palette.mode).toBe('light')
    expect(theme.palette.primary.main).toBe(themePalettes.light.primary)
  })

  it('creates a dark theme using the dark palette', () => {
    const theme = createArenaTheme({ mode: 'dark' })
    expect(theme.palette.mode).toBe('dark')
    expect(theme.palette.background.default).toBe(themePalettes.dark.background)
  })

  it('uses the survey primary color when provided', () => {
    const theme = createArenaTheme({ mode: 'dark', primaryColor: '#112233' })
    expect(theme.palette.primary.main).toBe('#112233')
  })
})

describe('resolveThemeMode', () => {
  it('returns the explicit preference', () => {
    expect(resolveThemeMode(themePreferences.light)).toBe('light')
    expect(resolveThemeMode(themePreferences.dark)).toBe('dark')
  })
})
