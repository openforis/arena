/**
 * Detector contracts. Detectors read the survey and Arena's own server, never an AI engine (nothing is sent before
 * Do it).
 */
import type { AssistantArea } from '@webapp/components/ai/Assistant/assistantAreas'

import type { SuggestionGeneration } from '../generation'
import type { SuggestionStore } from '../suggestionStore'
import type { AssistantSuggestion, SuggestionKind } from '../types'

export type SuggestionEvent =
  | { type: 'designerLeft'; newNodeDefUuids: string[] }
  | { type: 'publishClicked' }
  | { type: 'validationReportOpened'; cycle: string }
  | { type: 'jobSucceeded'; job: any }
  | { type: 'moduleEntered'; module: string }
  | { type: 'surveyInfoSaved' }
  | { type: 'categoryEditorLeft' }
  | { type: 'categoryLabelsApplied' }
  | { type: 'categoriesChanged' } // category import or delete
  | { type: 'generationStarted' } // sent by the host once the controller has the new generation (server counts)

export type DetectorContext = {
  userUuid: string
  generation: SuggestionGeneration | null // null only for survey-independent events (moduleEntered)
  survey: any | null // the defs in Redux for that generation
  availableAreas: AssistantArea[]
  store: SuggestionStore
  now: () => Date
}

// state detectors: run when a generation starts and 1 s after the survey changes; only when their area is available
export type StateDetector = {
  kind: SuggestionKind
  area: AssistantArea
  needsDraft: boolean
  detect: (ctx: DetectorContext) => AssistantSuggestion[]
}

// event detectors: run on their event; only when their area is available
export type EventDetector = {
  kind: SuggestionKind
  area: AssistantArea
  needsDraft: boolean
  on: SuggestionEvent['type'][]
  handle: (event: SuggestionEvent, ctx: DetectorContext) => void | Promise<void>
}

// resolvers: after every debounced survey change, targets for which isResolved returns true are removed
export type TargetResolver = { kind: SuggestionKind; isResolved: (targetKey: string, survey: any) => boolean }
