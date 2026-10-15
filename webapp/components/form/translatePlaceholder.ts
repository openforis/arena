type PlaceholderI18n = { t: (key: string) => unknown; exists: (key: string) => boolean }

/**
 * Returns the text of a placeholder: translated when it is an i18n key, else as it is. A URL or a model id would
 * otherwise lose the part before its ":" (i18next reads it as a namespace).
 * @param {PlaceholderI18n} i18n - i18n instance.
 * @param {string|null|undefined} placeholder - An i18n key, or the text to show.
 * @returns {string|null|undefined} The text to show.
 */
export const translatePlaceholder = (
  i18n: PlaceholderI18n,
  placeholder: string | null | undefined
): string | null | undefined => (placeholder && i18n.exists(placeholder) ? String(i18n.t(placeholder)) : placeholder)
