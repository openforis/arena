/**
 * The one place a suggestion kind is registered: its card and prompt, and the detectors and resolver that keep it up to
 * date. The map is complete: a kind added to ./types without an entry here does not compile, so its card cannot be
 * missing at run time. The arrays the host and the cards use are derived from it, in the order of the entries.
 */
import { axiosCleaningApi } from '@webapp/ai/tools/cleaning/cleaningApi'

import { attributeWithoutRefDefinition } from './definitions/attributeWithoutRef'
import { categoryItemTranslationsDefinition } from './definitions/categoryItemTranslations'
import { dataImportedDefinition } from './definitions/dataImported'
import { entityWithoutKeyDefinition } from './definitions/entityWithoutKey'
import { missingTranslationsDefinition } from './definitions/missingTranslations'
import { moduleIntroDefinition } from './definitions/moduleIntro'
import { newEntriesDescriptionsDefinition } from './definitions/newEntriesDescriptions'
import { publishErrorsDefinition } from './definitions/publishErrors'
import type { SuggestionDefinition } from './definitions/types'
import { validationErrorsDefinition } from './definitions/validationErrors'
import { attributeWithoutRefDetector } from './detectors/attributeWithoutRef'
import {
  categoryItemTranslationsDetector,
  categoryItemTranslationsResolver,
} from './detectors/categoryItemTranslations'
import { dataImportedDetector } from './detectors/dataImported'
import { entityWithoutKeyDetector, entityWithoutKeyResolver } from './detectors/entityWithoutKey'
import { missingTranslationsDetector } from './detectors/missingTranslations'
import { moduleIntroDetector } from './detectors/moduleIntro'
import { newEntriesDescriptionsDetector, newEntriesDescriptionsResolver } from './detectors/newEntriesDescriptions'
import { publishErrorsDetector, publishErrorsResolver } from './detectors/publishErrors'
import type { EventDetector, StateDetector, TargetResolver } from './detectors/types'
import { createValidationErrorsDetector } from './detectors/validationErrors'
import type { SuggestionKind } from './types'

export type SuggestionRegistration = {
  definition: SuggestionDefinition
  // keeps the kind up to date from the survey (when a generation starts and after survey changes)
  stateDetector?: StateDetector
  // creates the kind from an event
  eventDetector?: EventDetector
  // removes the targets that were fixed
  resolver?: TargetResolver
}

export const SUGGESTION_REGISTRY: Record<SuggestionKind, SuggestionRegistration> = {
  moduleIntro: { definition: moduleIntroDefinition, eventDetector: moduleIntroDetector },
  missingTranslations: { definition: missingTranslationsDefinition, stateDetector: missingTranslationsDetector },
  newEntriesDescriptions: {
    definition: newEntriesDescriptionsDefinition,
    eventDetector: newEntriesDescriptionsDetector,
    resolver: newEntriesDescriptionsResolver,
  },
  entityWithoutKey: {
    definition: entityWithoutKeyDefinition,
    eventDetector: entityWithoutKeyDetector,
    resolver: entityWithoutKeyResolver,
  },
  attributeWithoutRef: { definition: attributeWithoutRefDefinition, stateDetector: attributeWithoutRefDetector },
  publishErrors: {
    definition: publishErrorsDefinition,
    eventDetector: publishErrorsDetector,
    resolver: publishErrorsResolver,
  },
  categoryItemTranslations: {
    definition: categoryItemTranslationsDefinition,
    eventDetector: categoryItemTranslationsDetector,
    resolver: categoryItemTranslationsResolver,
  },
  validationErrors: {
    definition: validationErrorsDefinition,
    eventDetector: createValidationErrorsDetector({ countRows: axiosCleaningApi.countValidationReportRows }),
  },
  dataImported: { definition: dataImportedDefinition, eventDetector: dataImportedDetector },
}

const registrations = Object.values(SUGGESTION_REGISTRY)

export const SUGGESTION_DEFINITIONS = Object.fromEntries(
  Object.entries(SUGGESTION_REGISTRY).map(([kind, { definition }]) => [kind, definition])
) as Record<SuggestionKind, SuggestionDefinition>

export const STATE_DETECTORS: StateDetector[] = registrations.flatMap(({ stateDetector }) => stateDetector ?? [])

export const EVENT_DETECTORS: EventDetector[] = registrations.flatMap(({ eventDetector }) => eventDetector ?? [])

export const TARGET_RESOLVERS: TargetResolver[] = registrations.flatMap(({ resolver }) => resolver ?? [])
