import { createTheme, type Theme } from '@mui/material/styles'

import { defaultTokens } from './tokens'

type CreateArenaThemeParams = {
  primaryColor?: string | null
}

/**
 * Creates the Arena MUI theme.
 */
export const createArenaTheme = ({ primaryColor = null }: CreateArenaThemeParams = {}): Theme => {
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
