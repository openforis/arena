import { createTheme, type Theme } from '@mui/material/styles'

import { defaultTokens, themeModes, themePalettes, type ThemeMode } from './tokens'

type CreateArenaThemeParams = {
  mode?: ThemeMode
  primaryColor?: string | null
}

/**
 * Creates the Arena MUI theme for the given mode.
 *
 * @param {CreateArenaThemeParams} params - The parameters.
 * @param {ThemeMode} [params.mode] - Theme mode (light or dark).
 * @param {string|null} [params.primaryColor] - Survey branding primary color.
 * @returns {Theme} The MUI theme.
 */
export const createArenaTheme = ({
  mode = themeModes.light,
  primaryColor = null,
}: CreateArenaThemeParams = {}): Theme => {
  const palette = themePalettes[mode]
  return createTheme({
    typography: {
      fontFamily: defaultTokens.typography.fontFamily,
    },
    palette: {
      mode,
      primary: { main: primaryColor || palette.primary, contrastText: palette.onPrimary },
      secondary: { main: palette.secondary, contrastText: palette.onSecondary },
      error: { main: palette.error },
      success: { main: palette.success },
      warning: { main: palette.warning },
      text: { primary: palette.onSurface, secondary: palette.onSurfaceVariant },
      background: { default: palette.background, paper: palette.surface },
      divider: palette.outline,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          // no dark mode elevation overlay: it lightens menus/popovers and lowers the contrast of their content
          root: { backgroundImage: 'none' },
        },
      },
      MuiPopover: {
        styleOverrides: {
          // shadows are barely visible on dark backgrounds: outline popups (menus, popovers) instead
          paper: mode === themeModes.dark ? { border: `1px solid ${palette.outline}` } : {},
        },
      },
    },
  })
}
