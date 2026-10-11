/**
 * Detector registries: each suggestion adds one import and one element to the arrays it uses.
 */
import { missingTranslationsDetector } from './missingTranslations'
import { newEntriesDescriptionsDetector, newEntriesDescriptionsResolver } from './newEntriesDescriptions'
import { moduleIntroDetector } from './moduleIntro'
import type { EventDetector, StateDetector, TargetResolver } from './types'

export type { DetectorContext, EventDetector, StateDetector, SuggestionEvent, TargetResolver } from './types'

export const STATE_DETECTORS: StateDetector[] = [missingTranslationsDetector]

export const EVENT_DETECTORS: EventDetector[] = [moduleIntroDetector, newEntriesDescriptionsDetector]

export const TARGET_RESOLVERS: TargetResolver[] = [newEntriesDescriptionsResolver]
