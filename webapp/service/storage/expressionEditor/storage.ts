const textModeStorageKey = 'expression-editor-text-mode'

/**
 * Reads the expression syntax (text mode) last chosen in this browser in editors where it can be selected.
 *
 * @returns {string | null} The stored text mode, or null if not set or storage is not available.
 */
export const getTextMode = (): string | null => {
  try {
    return window.localStorage.getItem(textModeStorageKey)
  } catch {
    return null
  }
}

/**
 * Stores the expression syntax (text mode) chosen in this browser.
 *
 * @param {string} textMode - The text mode (json or sql).
 * @returns {void}
 */
export const setTextMode = (textMode: string): void => {
  try {
    window.localStorage.setItem(textModeStorageKey, textMode)
  } catch {
    // storage not available: the choice will last until the editor is closed
  }
}
