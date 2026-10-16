/**
 * The text a translation is made from, shown next to a proposed label so the user can judge it.
 */

// a label in another language: what the proposed text translates
export type TranslationSource = { lang: string; text: string }

/**
 * Returns the source of a translation: the first filled text in another language, survey languages first (default
 * language first), then any other language the texts have. Same rule as the source given to the model.
 * @param {object} params - Parameters.
 * @param {Record<string, string>} params.texts - Texts by language.
 * @param {string} params.lang - Language of the proposed text.
 * @param {string[]} params.languages - Survey languages, default first.
 * @returns {TranslationSource|null} The source; null when no other language has a text.
 */
export const findTranslationSource = ({
  texts,
  lang,
  languages,
}: {
  texts: Record<string, string | null | undefined>
  lang: string
  languages: string[]
}): TranslationSource | null => {
  const candidates = [...languages, ...Object.keys(texts)]
  const sourceLang = candidates.find((other) => other !== lang && (texts[other] ?? '').trim() !== '')
  return sourceLang ? { lang: sourceLang, text: texts[sourceLang] as string } : null
}
