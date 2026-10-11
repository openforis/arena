/**
 * English prompts of the Design suggestions, sent as the user's message when the user clicks Do it.
 */

// §3.6: a turn stops after a few steps; the user asks for the rest
export const CONTINUE_TAIL = 'If some remain, end with "Say *continue* for the next batches."'

/**
 * Builds the prompt of suggestion 1.
 * @param {object} params - Parameters.
 * @param {string} params.lang - Missing language code (a survey language).
 * @param {string} params.langLabel - Its English name.
 * @returns {string} The prompt.
 */
export const buildMissingTranslationsPrompt = ({ lang, langLabel }: { lang: string; langLabel: string }): string =>
  `Translate the survey texts that are missing in ${langLabel} (${lang}). Get them with survey_listMissingTexts and ` +
  'propose each batch with labels_proposeSet, at most 4 batches. Keep the meaning, the tone and any terms that are ' +
  `codes or units. Then say how many remain. ${CONTINUE_TAIL}`
