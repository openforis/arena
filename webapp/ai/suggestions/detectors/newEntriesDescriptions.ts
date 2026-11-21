/**
 * New entries descriptions suggestion: entries added during a designer visit that have no description in any language.
 */
import * as NodeDef from '@core/survey/nodeDef'

import { getFilledLanguages, getSurveyLanguages } from '@webapp/ai/tools/design/missingTexts'

import {
  findDesignNodeDef,
  getDesignDetectorScope,
  getNewSavedDesignNodeDefs,
  newDesignSuggestion,
} from './designTargets'
import type { DetectorContext, EventDetector, SuggestionEvent, TargetResolver } from './types'

/**
 * Tells whether a node definition has a description in some survey language.
 * @param {object} nodeDef - Node definition.
 * @param {string[]} languages - Survey languages.
 * @returns {boolean} True when it has one.
 */
export const hasDescription = (nodeDef: any, languages: string[]): boolean =>
  getFilledLanguages(nodeDef, 'descriptions', languages).length > 0

/**
 * Adds the new entries without a description; successive visits add to the same suggestion (store merge).
 * @param {SuggestionEvent} event - The event.
 * @param {DetectorContext} ctx - Detector context.
 * @returns {void}
 */
export const handleNewEntriesDescriptions = (event: SuggestionEvent, ctx: DetectorContext): void => {
  if (event.type !== 'designerLeft') return
  const scope = getDesignDetectorScope(ctx)
  if (!scope) return
  const languages = getSurveyLanguages(scope.survey)
  const targetKeys = getNewSavedDesignNodeDefs(scope.survey, event.newNodeDefUuids)
    .filter((nodeDef) => !hasDescription(nodeDef, languages))
    .map((nodeDef) => NodeDef.getUuid(nodeDef))
  if (targetKeys.length === 0) return
  const suggestion = newDesignSuggestion({
    kind: 'newEntriesDescriptions',
    scopeKey: 'visit',
    surveyId: scope.surveyId,
    targetKeys,
    now: ctx.now(),
  })
  ctx.store.add({ userUuid: ctx.userUuid, suggestion })
}

export const newEntriesDescriptionsDetector: EventDetector = {
  kind: 'newEntriesDescriptions',
  area: 'design',
  needsDraft: true,
  on: ['designerLeft'],
  handle: handleNewEntriesDescriptions,
}

export const newEntriesDescriptionsResolver: TargetResolver = {
  kind: 'newEntriesDescriptions',
  isResolved: (targetKey, survey) => {
    const nodeDef = findDesignNodeDef(survey, targetKey)
    return !nodeDef || hasDescription(nodeDef, getSurveyLanguages(survey))
  },
}
