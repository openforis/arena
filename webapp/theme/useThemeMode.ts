import { useCallback, useEffect, useState } from 'react'

import type { ThemeMode } from './tokens'
import {
  getThemePreference,
  onSystemThemeModeChange,
  resolveThemeMode,
  setThemePreference as storeThemePreference,
  themeChangeEventType,
  themePreferences,
  type ThemePreference,
} from './themeMode'

type UseThemeModeResult = {
  mode: ThemeMode
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

/**
 * Returns the current theme preference and resolved mode, kept in sync with storage and system color scheme changes.
 *
 * @returns {UseThemeModeResult} Theme preference, mode and setter.
 */
export const useThemeMode = (): UseThemeModeResult => {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference)
  const [mode, setMode] = useState<ThemeMode>(() => resolveThemeMode(preference))

  useEffect(() => {
    const onThemeChange = () => {
      const preferenceNext = getThemePreference()
      setPreference(preferenceNext)
      setMode(resolveThemeMode(preferenceNext))
    }
    window.addEventListener(themeChangeEventType, onThemeChange)
    return () => window.removeEventListener(themeChangeEventType, onThemeChange)
  }, [])

  useEffect(() => {
    if (preference !== themePreferences.system) return undefined
    return onSystemThemeModeChange(() => setMode(resolveThemeMode(preference)))
  }, [preference])

  const updatePreference = useCallback((preferenceNext: ThemePreference) => storeThemePreference(preferenceNext), [])

  return { mode, preference, setPreference: updatePreference }
}
