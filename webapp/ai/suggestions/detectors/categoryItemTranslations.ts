/**
 * Suggestion 6 (category item labels missing in a survey language). The counts come from Arena's server; Task 10's
 * event detector fetches them, this file turns them into suggestions.
 */
import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import type { MissingLabelsCounts } from '@common/ai/categoryItemLabels'

import type { AssistantSuggestion, SuggestionTarget } from '../types'
import { newDesignSuggestion } from './designTargets'
import type { TargetResolver } from './types'

export const CATEGORY_ITEM_TRANSLATIONS_KIND = 'categoryItemTranslations'

/**
 * Returns the categories with labels missing in a language, with their counts.
 * @param {MissingLabelsCounts} counts - Counts by category uuid and language.
 * @param {object[]} categories - Survey categories, in display order.
 * @param {string} lang - Language.
 * @returns {SuggestionTarget[]} The targets.
 */
const getLanguageTargets = (counts: MissingLabelsCounts, categories: any[], lang: string): SuggestionTarget[] =>
  categories.flatMap((category) => {
    const key = Category.getUuid(category)
    const count = counts[key]?.[lang] ?? 0
    return count > 0 ? [{ key, count }] : []
  })

/**
 * Builds one suggestion per survey language with missing category item labels.
 * @param {MissingLabelsCounts} counts - Server counts.
 * @param {object} survey - Survey (categories and languages; counts of anything else are ignored).
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Survey id.
 * @param {Date} params.now - Creation time.
 * @returns {AssistantSuggestion[]} The suggestions, in survey language order.
 */
export const detectCategoryItemTranslations = (
  counts: MissingLabelsCounts,
  survey: any,
  { surveyId, now }: { surveyId: number; now: Date }
): AssistantSuggestion[] => {
  const languages = Survey.getLanguages(Survey.getSurveyInfo(survey)) as unknown as string[]
  const categories = Survey.getCategoriesArray(survey)
  return languages.flatMap((lang) => {
    const targets = getLanguageTargets(counts, categories, lang)
    if (targets.length === 0) return []
    const suggestion = newDesignSuggestion({
      kind: CATEGORY_ITEM_TRANSLATIONS_KIND,
      scopeKey: lang,
      surveyId,
      targetKeys: [],
      now,
    })
    return [{ ...suggestion, targets }]
  })
}

// a deleted category drops its target; the counts are refreshed by the events of Task 10
export const categoryItemTranslationsResolver: TargetResolver = {
  kind: CATEGORY_ITEM_TRANSLATIONS_KIND,
  isResolved: (targetKey, survey) => !Survey.getCategoryByUuid(targetKey)(survey),
}
