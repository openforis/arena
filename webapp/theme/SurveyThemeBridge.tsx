import React, { useEffect, useMemo } from 'react'
import { ThemeProvider } from '@mui/material/styles'

import * as SurveyBranding from '@core/survey/surveyBranding'

import { useSurveyInfo } from '@webapp/store/survey'

import { applyCssVars, buildCssVarMap } from './applyCssVars'
import { createArenaTheme } from './createArenaTheme'
import { applyThemeMode } from './themeMode'
import { useThemeMode } from './useThemeMode'

type Props = {
  children?: React.ReactNode
}

/**
 * Applies the selected theme mode (light/dark) and the survey primary color to the MUI theme and to the CSS variables.
 *
 * @param {Props} props - The component props.
 * @returns {React.ReactElement} The themed children.
 */
export const SurveyThemeBridge = (props: Props) => {
  const { children } = props
  const surveyInfo = useSurveyInfo()
  const primaryColor = SurveyBranding.getPrimaryColor(surveyInfo)
  const { mode } = useThemeMode()

  const theme = useMemo(() => createArenaTheme({ mode, primaryColor }), [mode, primaryColor])

  useEffect(() => {
    applyThemeMode(mode)
  }, [mode])

  useEffect(() => {
    applyCssVars(buildCssVarMap({ primaryColor }))
  }, [primaryColor])

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
