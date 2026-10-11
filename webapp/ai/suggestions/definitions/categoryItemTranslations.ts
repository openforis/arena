/**
 * Card and prompt of suggestion 6 (category item labels missing in a survey language).
 */
import { getLanguageLabel } from '@core/app/languages'
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import { CATEGORY_ITEM_TRANSLATIONS_KIND } from '../detectors/categoryItemTranslations'
import { getSuggestionScopeKey } from '../detectors/designTargets'
import { buildCategoryItemTranslationsPrompt } from '../prompts/categoryLabelsPrompts'
import type { AssistantSuggestion } from '../types'
import { getLanguageDisplayName } from './missingTranslations'
import type { SuggestionDefinition } from './types'

/**
 * Returns the names of the target categories that still exist.
 * @param {AssistantSuggestion} suggestion - Suggestion (visible targets).
 * @param {object|null} survey - Survey.
 * @returns {string[]} The names, in target order.
 */
const getCategoryNames = (suggestion: AssistantSuggestion, survey: any | null): string[] =>
  suggestion.targets.flatMap(({ key }) => {
    const category = survey ? Survey.getCategoryByUuid(key)(survey) : null
    return category ? [Category.getName(category)] : []
  })

export const categoryItemTranslationsDefinition: SuggestionDefinition = {
  kind: CATEGORY_ITEM_TRANSLATIONS_KIND,
  card: (suggestion, ctx) => ({
    key: 'categoryItemTranslations.card',
    params: {
      count: suggestion.targets.reduce((sum, target) => sum + (target.count ?? 0), 0),
      language: getLanguageDisplayName(getSuggestionScopeKey(suggestion.id), ctx.lang),
    },
  }),
  prompt: (suggestion, ctx) => {
    const lang = getSuggestionScopeKey(suggestion.id)
    return buildCategoryItemTranslationsPrompt({
      lang,
      langLabel: getLanguageLabel(lang) || lang,
      categoryNames: getCategoryNames(suggestion, ctx.survey),
    })
  },
}
