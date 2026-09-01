import React, { useEffect, useMemo } from 'react'
import { ThemeProvider } from '@mui/material/styles'

import * as SurveyBranding from '@core/survey/surveyBranding'

import { useSurveyInfo } from '@webapp/store/survey'

import { applyCssVars, buildCssVarMap } from './applyCssVars'
import { createArenaTheme } from './createArenaTheme'
import { defaultTokens } from './tokens'

type Props = {
  children?: React.ReactNode
}

/**
 * Applies default or survey primary theme + CSS variables.
 */
export const SurveyThemeBridge = (props: Props) => {
  const { children } = props
  const surveyInfo = useSurveyInfo()
  const primaryColor = SurveyBranding.getPrimaryColor(surveyInfo)

  const theme = useMemo(() => createArenaTheme({ primaryColor }), [primaryColor])

  useEffect(() => {
    applyCssVars(buildCssVarMap({ tokens: defaultTokens, primaryColor }))
  }, [primaryColor])

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}
