/**
 * Detector registries: each suggestion adds one import and one element to the arrays it uses.
 */
import { attributeWithoutRefDetector } from './attributeWithoutRef'
import { categoryItemTranslationsDetector, categoryItemTranslationsResolver } from './categoryItemTranslations'
import { entityWithoutKeyDetector, entityWithoutKeyResolver } from './entityWithoutKey'
import { missingTranslationsDetector } from './missingTranslations'
import { newEntriesDescriptionsDetector, newEntriesDescriptionsResolver } from './newEntriesDescriptions'
import { moduleIntroDetector } from './moduleIntro'
import { publishErrorsDetector, publishErrorsResolver } from './publishErrors'
import type { EventDetector, StateDetector, TargetResolver } from './types'

export type { DetectorContext, EventDetector, StateDetector, SuggestionEvent, TargetResolver } from './types'

export const STATE_DETECTORS: StateDetector[] = [missingTranslationsDetector, attributeWithoutRefDetector]

export const EVENT_DETECTORS: EventDetector[] = [
  moduleIntroDetector,
  newEntriesDescriptionsDetector,
  entityWithoutKeyDetector,
  publishErrorsDetector,
  categoryItemTranslationsDetector,
]

export const TARGET_RESOLVERS: TargetResolver[] = [
  newEntriesDescriptionsResolver,
  entityWithoutKeyResolver,
  publishErrorsResolver,
  categoryItemTranslationsResolver,
]
