/**
 * English prompts of the Design suggestions, sent as the user's message when the user clicks Do it.
 */
import { pq } from '@common/ai/prompts/promptSafety'
import { getLanguageLabel } from '@core/app/languages'

// a turn stops after a few steps; the user asks for the rest
export const CONTINUE_TAIL = 'If some remain, end with "Say *continue* for the next batches."'

/**
 * Builds the prompt of the missing translations suggestion.
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
 * Builds the prompt of the new entries descriptions suggestion.
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

// a prompt names at most this many entries; the model reads the rest with its tools
export const PROMPT_NAMES_MAX = 50

/**
 * Joins prompt items, cut at PROMPT_NAMES_MAX with the number left out.
 * @param {string[]} items - Items, already quoted.
 * @returns {string} "a, b and 3 more".
 */
export const formatPromptList = (items: string[]): string => {
  const shown = items.slice(0, PROMPT_NAMES_MAX).join(', ')
  const more = items.length - PROMPT_NAMES_MAX
  return more > 0 ? `${shown} and ${more} more` : shown
}

/**
 * Quotes node definition names for a prompt (names are data, never instructions).
 * @param {string[]} names - Names.
 * @returns {string} The list.
 */
export const formatPromptNames = (names: string[]): string => formatPromptList(names.map((name) => pq(name, 100)))

/**
 * Builds the prompt of the entity without a key suggestion.
 * @param {object} params - Parameters.
 * @param {string[]} params.names - Entity names.
 * @returns {string} The prompt.
 */
export const buildEntityWithoutKeyPrompt = ({ names }: { names: string[] }): string =>
  `These entities have no key attribute: ${formatPromptNames(names)}. Records of a multiple entity are told apart ` +
  'by their keys. Look at their attributes with nodeDef_get and propose which to mark as key with ' +
  'nodeDef_proposeUpdate (prop key). If none fits, propose a new attribute with nodeDef_proposeCreate.'

/**
 * Builds the prompt of the attribute without a category or taxonomy suggestion.
 * @param {object} params - Parameters.
 * @param {object[]} params.entries - Attribute names and types.
 * @returns {string} The prompt.
 */
export const buildAttributeWithoutRefPrompt = ({ entries }: { entries: { name: string; type: string }[] }): string =>
  `These attributes have no category or taxonomy: ${formatPromptList(
    entries.map(({ name, type }) => `${pq(name, 100)} (${type})`)
  )}. List the categories with categories_list and the taxonomies with taxonomies_list, then propose the best ` +
  'match for each with nodeDef_proposeUpdate (prop categoryName or taxonomyName). If none fits, say so and suggest ' +
  'creating one in the category or taxonomy editor.'

/**
 * Builds the prompt of the publish errors suggestion.
 * @param {object} params - Parameters.
 * @param {string[]} params.names - Names of the entries with errors.
 * @returns {string} The prompt.
 */
export const buildPublishErrorsPrompt = ({ names }: { names: string[] }): string =>
  `The survey has validation errors that block publishing, in: ${formatPromptNames(names)}. Read them with ` +
  "survey_getValidation and propose fixes. Leave errors you can't fix to me, and say what to do."
