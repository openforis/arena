/**
 * Detector registries: each suggestion adds one import and one element to the arrays it uses.
 */
import { moduleIntroDetector } from './moduleIntro'
import type { EventDetector, StateDetector, TargetResolver } from './types'

export type { DetectorContext, EventDetector, StateDetector, SuggestionEvent, TargetResolver } from './types'

export const STATE_DETECTORS: StateDetector[] = []

export const EVENT_DETECTORS: EventDetector[] = [moduleIntroDetector]

export const TARGET_RESOLVERS: TargetResolver[] = []
