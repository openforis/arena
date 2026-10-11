/**
 * Detector registries: each suggestion adds one import and one element to the arrays it uses.
 */
import { axiosCleaningApi } from '@webapp/ai/tools/cleaning/cleaningApi'

import { attributeWithoutRefDetector } from './attributeWithoutRef'
import { categoryItemTranslationsDetector, categoryItemTranslationsResolver } from './categoryItemTranslations'
import { dataImportedDetector } from './dataImported'
import { entityWithoutKeyDetector, entityWithoutKeyResolver } from './entityWithoutKey'
import { missingTranslationsDetector } from './missingTranslations'
import { newEntriesDescriptionsDetector, newEntriesDescriptionsResolver } from './newEntriesDescriptions'
import { moduleIntroDetector } from './moduleIntro'
import { publishErrorsDetector, publishErrorsResolver } from './publishErrors'
import type { EventDetector, StateDetector, TargetResolver } from './types'
import { createValidationErrorsDetector } from './validationErrors'

export type { DetectorContext, EventDetector, StateDetector, SuggestionEvent, TargetResolver } from './types'

export const STATE_DETECTORS: StateDetector[] = [missingTranslationsDetector, attributeWithoutRefDetector]

export const EVENT_DETECTORS: EventDetector[] = [
  moduleIntroDetector,
  newEntriesDescriptionsDetector,
  entityWithoutKeyDetector,
  publishErrorsDetector,
  categoryItemTranslationsDetector,
  createValidationErrorsDetector({ countRows: axiosCleaningApi.countValidationReportRows }),
  dataImportedDetector,
]

export const TARGET_RESOLVERS: TargetResolver[] = [
  newEntriesDescriptionsResolver,
  entityWithoutKeyResolver,
  publishErrorsResolver,
  categoryItemTranslationsResolver,
]
