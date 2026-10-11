/**
 * Card and prompt of each kind; cards of a kind without a definition are not shown.
 */
import type { SuggestionKind } from '../types'
import { attributeWithoutRefDefinition } from './attributeWithoutRef'
import { categoryItemTranslationsDefinition } from './categoryItemTranslations'
import { dataImportedDefinition } from './dataImported'
import { entityWithoutKeyDefinition } from './entityWithoutKey'
import { missingTranslationsDefinition } from './missingTranslations'
import { moduleIntroDefinition } from './moduleIntro'
import { newEntriesDescriptionsDefinition } from './newEntriesDescriptions'
import { publishErrorsDefinition } from './publishErrors'
import type { SuggestionDefinition } from './types'
import { validationErrorsDefinition } from './validationErrors'

export type { SuggestionDefinition, SuggestionDescribeContext } from './types'

export const SUGGESTION_DEFINITIONS: Partial<Record<SuggestionKind, SuggestionDefinition>> = {
  moduleIntro: moduleIntroDefinition,
  missingTranslations: missingTranslationsDefinition,
  newEntriesDescriptions: newEntriesDescriptionsDefinition,
  entityWithoutKey: entityWithoutKeyDefinition,
  attributeWithoutRef: attributeWithoutRefDefinition,
  publishErrors: publishErrorsDefinition,
  categoryItemTranslations: categoryItemTranslationsDefinition,
  validationErrors: validationErrorsDefinition,
  dataImported: dataImportedDefinition,
}
