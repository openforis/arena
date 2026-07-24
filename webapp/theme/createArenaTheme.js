import { createTheme } from '@mui/material/styles'

import { defaultTokens } from './tokens'

/**
 * Creates the Arena MUI theme.
 * @param {{primaryColor?: string|null}} [params]
 * @returns {import('@mui/material/styles').Theme}
 */
export const createArenaTheme = ({ primaryColor = null } = {}) => {
  const main = primaryColor || defaultTokens.colors.blue
  return createTheme({
    typography: {
      fontFamily: defaultTokens.typography.fontFamily,
    },
    palette: {
      primary: { main },
      error: { main: defaultTokens.colors.red },
      success: { main: defaultTokens.colors.green },
      warning: { main: defaultTokens.colors.orange },
      text: { primary: defaultTokens.colors.black },
      background: { default: defaultTokens.colors.greyAppBg, paper: defaultTokens.colors.white },
    },
  })
}
