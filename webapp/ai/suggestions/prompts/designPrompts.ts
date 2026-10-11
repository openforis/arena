/**
 * English prompts of the Design suggestions, sent as the user's message when the user clicks Do it.
 */
import { getLanguageLabel } from '@core/app/languages'

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

/**
 * Formats survey languages for a prompt: "en (English), fr (French)".
 * @param {string[]} languages - Language codes.
 * @returns {string} The list.
 */
export const formatPromptLanguages = (languages: string[]): string =>
  languages.map((lang) => `${lang} (${getLanguageLabel(lang) || lang})`).join(', ')

/**
 * Builds the prompt of suggestion 2.
 * @param {object} params - Parameters.
 * @param {string[]} params.languages - Survey languages.
 * @returns {string} The prompt.
 */
export const buildNewEntriesDescriptionsPrompt = ({ languages }: { languages: string[] }): string => {
  const where = languages.length > 0 ? ` (${formatPromptLanguages(languages)})` : ''
  return (
    'Write a short description (one sentence, for the data collector) for each new entry, in every survey ' +
    `language${where}. List them with survey_listMissingTexts (kind descriptions, onlyEmpty), read each one with ` +
    'nodeDef_get, and propose them with labels_proposeSet, kind descriptions, at most 4 batches. Then say how many ' +
    `remain. ${CONTINUE_TAIL}`
  )
}
