const primaryColorVarName = '--color-primary'

type BuildCssVarMapParams = {
  primaryColor?: string | null
}

/**
 * Builds the CSS custom properties to set inline on :root.
 * Only the survey primary color is overridden: the other tokens (and the ones derived from the primary color)
 * come from the active theme defined in `themes.scss`.
 *
 * @param {BuildCssVarMapParams} params - The parameters.
 * @param {string|null} [params.primaryColor] - Survey branding primary color; null to use the theme one.
 * @returns {Record<string, string|null>} Map of CSS variable name to value (null means "remove the override").
 */
export const buildCssVarMap = ({ primaryColor = null }: BuildCssVarMapParams = {}): Record<string, string | null> => ({
  [primaryColorVarName]: primaryColor || null,
})

/**
 * Applies (or removes, when the value is null) CSS variables on documentElement.
 *
 * @param {Record<string, string|null>} varMap - Map of CSS variable name to value.
 * @returns {void}
 */
export const applyCssVars = (varMap: Record<string, string | null>): void => {
  const { style } = document.documentElement
  for (const [key, value] of Object.entries(varMap)) {
    if (value) {
      style.setProperty(key, value)
    } else {
      style.removeProperty(key)
    }
  }
}
