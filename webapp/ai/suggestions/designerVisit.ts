/**
 * Designer visit of the "new entries" suggestions: entering the designer snapshots the eligible node defs; leaving it,
 * or a new generation, reports the saved ones created since.
 */
import * as NodeDef from '@core/survey/nodeDef'

import { getDesignNodeDefs } from '@webapp/ai/tools/design/surveyLookup'

import type { SuggestionGeneration } from './generation'

export type DesignerVisit = { generationId: number; userUuid: string; surveyId: number; snapshot: string[] }

export type DesignerVisitStep = { visit: DesignerVisit | null; leftUuids: string[] | null }

const DESIGNER_MODULE = 'designer'

/**
 * Returns a snapshot of the eligible node defs.
 * @param {SuggestionGeneration} generation - Current generation.
 * @param {object} survey - Survey (defs of the generation).
 * @returns {DesignerVisit} The visit.
 */
const startVisit = (generation: SuggestionGeneration, survey: any): DesignerVisit => ({
  generationId: generation.id,
  userUuid: generation.userUuid,
  surveyId: generation.surveyId,
  snapshot: getDesignNodeDefs(survey).map((nodeDef) => NodeDef.getUuid(nodeDef)),
})

/**
 * Returns the saved eligible node defs that are not in the snapshot.
 * @param {DesignerVisit} visit - Visit.
 * @param {object} survey - Survey.
 * @returns {string[]} Their uuids.
 */
const newSavedUuids = (visit: DesignerVisit, survey: any): string[] => {
  const seen = new Set(visit.snapshot)
  return getDesignNodeDefs(survey)
    .filter((nodeDef) => !NodeDef.isTemporary(nodeDef) && !seen.has(NodeDef.getUuid(nodeDef)))
    .map((nodeDef) => NodeDef.getUuid(nodeDef))
}

/**
 * Returns the next visit state for the current module and generation.
 * @param {DesignerVisit|null} prev - Current visit.
 * @param {object} params - Parameters.
 * @param {string|null} params.module - App module.
 * @param {SuggestionGeneration|null} params.generation - Current generation (null: defs not loaded).
 * @param {object|null} params.survey - Survey of the generation.
 * @returns {DesignerVisitStep} The visit, and the new saved node def uuids when the visit ended (else null).
 */
export const nextDesignerVisit = (
  prev: DesignerVisit | null,
  { module, generation, survey }: { module: string | null; generation: SuggestionGeneration | null; survey: any | null }
): DesignerVisitStep => {
  // the defs are not loaded (yet): wait
  if (!generation || !survey) return { visit: prev, leftUuids: null }
  const inDesigner = module === DESIGNER_MODULE
  const next = inDesigner ? startVisit(generation, survey) : null
  if (!prev) return { visit: next, leftUuids: null }
  // another user or survey: the snapshot means nothing there
  if (prev.userUuid !== generation.userUuid || prev.surveyId !== generation.surveyId) {
    return { visit: next, leftUuids: null }
  }
  if (inDesigner && prev.generationId === generation.id) return { visit: prev, leftUuids: null }
  return { visit: next, leftUuids: newSavedUuids(prev, survey) }
}
