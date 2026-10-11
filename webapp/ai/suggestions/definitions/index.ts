/**
 * Card and prompt of each kind; cards of a kind without a definition are not shown.
 */
import type { SuggestionKind } from '../types'
import { missingTranslationsDefinition } from './missingTranslations'
import { moduleIntroDefinition } from './moduleIntro'
import type { SuggestionDefinition } from './types'

export type { SuggestionDefinition, SuggestionDescribeContext } from './types'

export const SUGGESTION_DEFINITIONS: Partial<Record<SuggestionKind, SuggestionDefinition>> = {
  moduleIntro: moduleIntroDefinition,
  missingTranslations: missingTranslationsDefinition,
}
