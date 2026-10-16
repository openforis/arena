const storageKey = 'ui-language'

/**
 * Reads the UI language chosen in this browser (e.g. in the guest views).
 *
 * @returns {string | null} The stored language code, or null if not set or storage is not available.
 */
export const getUILanguage = (): string | null => {
  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

/**
 * Stores the UI language chosen in this browser.
 *
 * @param {string} lang - The language code.
 * @returns {void}
 */
export const setUILanguage = (lang: string): void => {
  try {
    window.localStorage.setItem(storageKey, lang)
  } catch {
    // storage not available: the language will last until page reload
  }
}
