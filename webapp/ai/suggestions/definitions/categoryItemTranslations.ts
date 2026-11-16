/**
 * Card of the category item translations suggestion (category item labels missing in a survey language). Do it runs
 * a browser batch (CategoryLabelsBatchHost), not a chat turn: the definition has no prompt.
 */
import { CATEGORY_ITEM_TRANSLATIONS_KIND } from '../detectors/categoryItemTranslations'
import { getSuggestionScopeKey } from '../detectors/designTargets'
import { getLanguageDisplayName } from './missingTranslations'
import type { SuggestionDefinition } from './types'

export const categoryItemTranslationsDefinition: SuggestionDefinition = {
  kind: CATEGORY_ITEM_TRANSLATIONS_KIND,
  card: (suggestion, ctx) => ({
    key: 'categoryItemTranslations.card',
    params: {
      count: suggestion.targets.reduce((sum, target) => sum + (target.count ?? 0), 0),
      language: getLanguageDisplayName(getSuggestionScopeKey(suggestion.id), ctx.lang),
    },
  }),
}
