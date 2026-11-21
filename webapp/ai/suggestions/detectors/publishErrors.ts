/**
 * Publish errors suggestion: on Publish, the entries whose validation has errors (publishing would fail). Warnings do not block
 * publishing and are left out.
 */
import * as NodeDef from '@core/survey/nodeDef'

import { getNodeDefIssues } from '@webapp/ai/tools/design/surveyGetValidation'
import { getDesignNodeDefsDepthFirst } from '@webapp/ai/tools/design/surveyLookup'

import { findDesignNodeDef, getDesignDetectorScope, newDesignSuggestion } from './designTargets'
import type { DetectorContext, EventDetector, SuggestionEvent, TargetResolver } from './types'

// only the severity is read: the messages are never shown
const keepKey = (key: string): string => key

/**
 * Tells whether the stored validation of a node definition has errors (at any field, children included).
 * @param {object} survey - Survey with the node definitions validation.
 * @param {object} nodeDef - Node definition.
 * @returns {boolean} True when publishing would fail on it.
 */
export const hasPublishErrors = (survey: any, nodeDef: any): boolean =>
  getNodeDefIssues(survey, nodeDef, keepKey).some((issue) => issue.severity === 'error')

/**
 * Adds the saved entries with errors when the user clicks Publish.
 * @param {SuggestionEvent} event - The event.
 * @param {DetectorContext} ctx - Detector context.
 * @returns {void}
 */
export const handlePublishErrors = (event: SuggestionEvent, ctx: DetectorContext): void => {
  if (event.type !== 'publishClicked') return
  const scope = getDesignDetectorScope(ctx)
  if (!scope) return
  const targetKeys = getDesignNodeDefsDepthFirst(scope.survey)
    .filter((nodeDef) => !NodeDef.isTemporary(nodeDef) && hasPublishErrors(scope.survey, nodeDef))
    .map((nodeDef) => NodeDef.getUuid(nodeDef))
  if (targetKeys.length === 0) return
  const suggestion = newDesignSuggestion({
    kind: 'publishErrors',
    scopeKey: 'survey',
    surveyId: scope.surveyId,
    targetKeys,
    now: ctx.now(),
  })
  ctx.store.add({ userUuid: ctx.userUuid, suggestion })
}

export const publishErrorsDetector: EventDetector = {
  kind: 'publishErrors',
  area: 'design',
  needsDraft: true,
  on: ['publishClicked'],
  handle: handlePublishErrors,
}

export const publishErrorsResolver: TargetResolver = {
  kind: 'publishErrors',
  isResolved: (targetKey, survey) => {
    const nodeDef = findDesignNodeDef(survey, targetKey)
    return !nodeDef || !hasPublishErrors(survey, nodeDef)
  },
}
