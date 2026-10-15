/**
 * English prompt of the category item labels suggestion, sent on Do it.
 */
import { pq } from '@common/ai/prompts/promptSafety'

import { CONTINUE_TAIL } from './designPrompts'

/**
 * Builds the prompt that asks for the missing category item labels of a language.
 * @param {object} params - Parameters.
 * @param {string} params.lang - Language code.
 * @param {string} params.langLabel - English name of the language.
 * @param {string[]} params.categoryNames - Categories to translate (the visible targets).
 * @returns {string} The prompt.
 */
export const buildCategoryItemTranslationsPrompt = ({
  lang,
  langLabel,
  categoryNames,
}: {
  lang: string
  langLabel: string
  categoryNames: string[]
}): string =>
  `Translate the category item labels that are missing in ${langLabel} (${lang}), in these categories: ` +
  `${categoryNames.map((name) => pq(name, 100)).join(', ')}. Get the items with categoryItems_listMissingLabels ` +
  'and propose each batch with categoryItemLabels_proposeSet, at most 4 batches. Then say how many remain. ' +
  CONTINUE_TAIL
