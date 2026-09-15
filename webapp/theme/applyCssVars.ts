import { defaultTokens, type ArenaTokens } from './tokens'

export { defaultTokens }

type BuildCssVarMapParams = {
  tokens?: ArenaTokens
  primaryColor?: string | null
}

/**
 * Builds CSS custom property map for :root.
 * When primaryColor is set, maps it onto the blue brand family used by SCSS.
 */
export const buildCssVarMap = ({ tokens = defaultTokens, primaryColor = null }: BuildCssVarMapParams = {}): Record<
  string,
  string
> => {
  const c = tokens.colors
  const blue = primaryColor || c.blue
  return {
    '--fontFamily': tokens.typography.fontFamily,
    '--blue': blue,
    '--blueLight': c.blueLight,
    '--blueLightFocus': c.blueLightFocus,
    '--blueLightActive': c.blueLightActive,
    '--blueDark': primaryColor || c.blueDark,
    '--colorTextPrimary': primaryColor || c.colorTextPrimary,
    '--borderColorFocussed': primaryColor || c.colorTextPrimary,
    '--red': c.red,
    '--green': c.green,
    '--grey': c.grey,
    '--greyAppBg': c.greyAppBg,
    '--greyBorder': c.greyBorder,
    '--orange': c.orange,
    '--black': c.black,
    '--white': c.white,
  }
}

/**
 * Applies CSS variables on documentElement.
 */
export const applyCssVars = (varMap: Record<string, string>): void => {
  const root = document.documentElement
  Object.entries(varMap).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}
