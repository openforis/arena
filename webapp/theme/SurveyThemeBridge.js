import React, { useEffect, useMemo } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import PropTypes from 'prop-types'

import * as SurveyBranding from '@core/survey/surveyBranding'

import { useSurveyInfo } from '@webapp/store/survey'

import { applyCssVars, buildCssVarMap } from './applyCssVars'
import { createArenaTheme } from './createArenaTheme'
import { defaultTokens } from './tokens'

/**
 * Applies default or survey primary theme + CSS variables.
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - App tree to render with themed MUI context.
 * @returns {React.ReactElement} ThemeProvider wrapping children.
 */
export const SurveyThemeBridge = (props) => {
  const { children } = props
  const surveyInfo = useSurveyInfo()
  const primaryColor = SurveyBranding.getPrimaryColor(surveyInfo)

  const theme = useMemo(() => createArenaTheme({ primaryColor }), [primaryColor])

  useEffect(() => {
    applyCssVars(buildCssVarMap({ tokens: defaultTokens, primaryColor }))
  }, [primaryColor])

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

SurveyThemeBridge.propTypes = {
  children: PropTypes.node,
}
