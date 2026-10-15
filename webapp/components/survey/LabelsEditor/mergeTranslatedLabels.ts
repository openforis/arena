/**
 * The labels after an AI translation: the translations fill the languages that are still empty when the answer
 * arrives, never a text the user typed while it ran. If the text that was translated changed meanwhile, nothing is
 * applied: the translation is of a text that is no longer there.
 */
export type Labels = Record<string, string>

/**
 * Returns true for a label with text.
 * @param {unknown} text - Label of a language.
 * @returns {boolean} True when it has non-blank text.
 */
const hasText = (text: unknown): boolean => typeof text === 'string' && text.trim().length > 0

/**
 * Merges translations into the current labels.
 * @param {object} params - Parameters.
 * @param {Labels} params.labels - The labels as they are now (not as they were when the translation was requested).
 * @param {object} params.source - The language and text that were translated.
 * @param {string[]} params.targetLangs - The languages that were requested.
 * @param {Record<string, unknown>} params.byLang - The translation of each language.
 * @returns {{labels: Labels, applied: string[], sourceChanged: boolean}} The merged labels (the same object when
 * nothing applies), the languages that were filled, and whether the translated text changed meanwhile.
 */
export const mergeTranslatedLabels = ({
  labels,
  source,
  targetLangs,
  byLang,
}: {
  labels: Labels
  source: { lang: string; text: string }
  targetLangs: string[]
  byLang: Record<string, unknown>
}): { labels: Labels; applied: string[]; sourceChanged: boolean } => {
  if (labels[source.lang] !== source.text) return { labels, applied: [], sourceChanged: true }
  const merged = { ...labels }
  const applied: string[] = []
  for (const [lang, text] of Object.entries(byLang)) {
    if (!targetLangs.includes(lang) || !hasText(text) || hasText(labels[lang])) continue
    merged[lang] = text as string
    applied.push(lang)
  }
  return { labels: applied.length > 0 ? merged : labels, applied, sourceChanged: false }
}
