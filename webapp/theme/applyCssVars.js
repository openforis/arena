import { defaultTokens } from './tokens'

export { defaultTokens }

/**
 * Builds CSS custom property map for :root.
 * When primaryColor is set, maps it onto the blue brand family used by SCSS.
 * @param {{tokens?: object, primaryColor?: string|null}} params
 * @returns {Record<string, string>}
 */
export const buildCssVarMap = ({ tokens = defaultTokens, primaryColor = null } = {}) => {
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
 * @param {Record<string, string>} varMap
 * @returns {void}
 */
export const applyCssVars = (varMap) => {
  const root = document.documentElement
  Object.entries(varMap).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}
