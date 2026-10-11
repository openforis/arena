/**
 * Formats a count of a card in the UI language (1,200 in English).
 * @param {number} count - The count.
 * @param {string} lang - UI language.
 * @returns {string} The formatted count; the plain number when the language is not a valid tag.
 */
export const formatSuggestionCount = (count: number, lang: string): string => {
  try {
    return new Intl.NumberFormat(lang).format(count)
  } catch {
    return String(count)
  }
}
