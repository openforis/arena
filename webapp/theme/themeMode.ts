import { themeModes, type ThemeMode } from './tokens'

export const themePreferences = {
  ...themeModes,
  system: 'system',
} as const

export type ThemePreference = (typeof themePreferences)[keyof typeof themePreferences]

const storageKey = 'theme'

export const themeChangeEventType = 'theme-change'

const darkColorSchemeQuery = '(prefers-color-scheme: dark)'

const isThemePreference = (value: unknown): value is ThemePreference =>
  Object.values(themePreferences).includes(value as ThemePreference)

/**
 * Reads the theme preference stored in the browser (defaults to light).
 *
 * @returns {ThemePreference} The stored preference.
 */
export const getThemePreference = (): ThemePreference => {
  try {
    const value = window.localStorage.getItem(storageKey)
    return isThemePreference(value) ? value : themePreferences.light
  } catch {
    return themePreferences.light
  }
}

/**
 * Detects the color scheme preferred by the operating system.
 *
 * @returns {ThemeMode} The system theme mode.
 */
export const getSystemThemeMode = (): ThemeMode =>
  window.matchMedia?.(darkColorSchemeQuery).matches ? themeModes.dark : themeModes.light

/**
 * Resolves a preference into an actual theme mode.
 *
 * @param {ThemePreference} preference - The theme preference.
 * @returns {ThemeMode} The theme mode to apply.
 */
export const resolveThemeMode = (preference: ThemePreference): ThemeMode =>
  preference === themePreferences.system ? getSystemThemeMode() : preference

/**
 * Applies the theme mode to the document (selects the CSS custom properties set defined in `themes.scss`).
 *
 * @param {ThemeMode} mode - The theme mode.
 * @returns {void}
 */
export const applyThemeMode = (mode: ThemeMode): void => {
  document.documentElement.dataset.theme = mode
}

/**
 * Stores the theme preference and notifies the listeners.
 *
 * @param {ThemePreference} preference - The theme preference.
 * @returns {void}
 */
export const setThemePreference = (preference: ThemePreference): void => {
  try {
    window.localStorage.setItem(storageKey, preference)
  } catch {
    // storage not available: the preference will last until page reload
  }
  window.dispatchEvent(new CustomEvent(themeChangeEventType, { detail: preference }))
}

/**
 * Subscribes to changes of the system color scheme.
 *
 * @param {Function} listener - Called when the system color scheme changes.
 * @returns {Function} Unsubscribe function.
 */
export const onSystemThemeModeChange = (listener: () => void): (() => void) => {
  const mediaQueryList = window.matchMedia?.(darkColorSchemeQuery)
  mediaQueryList?.addEventListener('change', listener)
  return () => mediaQueryList?.removeEventListener('change', listener)
}
