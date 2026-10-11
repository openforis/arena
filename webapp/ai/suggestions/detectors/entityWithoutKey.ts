/**
 * Suggestion 4: multiple entities added during a designer visit without a key attribute (the designer saves them).
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import {
  findDesignNodeDef,
  getDesignDetectorScope,
  getNewSavedDesignNodeDefs,
  newDesignSuggestion,
} from './designTargets'
import type { DetectorContext, EventDetector, SuggestionEvent, TargetResolver } from './types'

/**
 * Tells whether a node definition is a multiple entity with no key among its direct children (validateKeyAttributes).
 * @param {object} survey - Survey.
 * @param {object} nodeDef - Node definition.
 * @returns {boolean} True when it needs a key.
 */
export const isEntityWithoutKey = (survey: any, nodeDef: any): boolean => {
  if (!NodeDef.isMultipleEntity(nodeDef)) return false
  const uuid = NodeDef.getUuid(nodeDef)
  return !Survey.getNodeDefsArray(survey).some(
    (child: any) => NodeDef.getParentUuid(child) === uuid && NodeDef.isKey(child) && !NodeDef.isDeleted(child)
  )
}

/**
 * Adds the new multiple entities without a key.
 * @param {SuggestionEvent} event - The event.
 * @param {DetectorContext} ctx - Detector context.
 * @returns {void}
 */
export const handleEntityWithoutKey = (event: SuggestionEvent, ctx: DetectorContext): void => {
  if (event.type !== 'designerLeft') return
  const scope = getDesignDetectorScope(ctx)
  if (!scope) return
  const targetKeys = getNewSavedDesignNodeDefs(scope.survey, event.newNodeDefUuids)
    .filter((nodeDef) => isEntityWithoutKey(scope.survey, nodeDef))
    .map((nodeDef) => NodeDef.getUuid(nodeDef))
  if (targetKeys.length === 0) return
  const suggestion = newDesignSuggestion({
    kind: 'entityWithoutKey',
    scopeKey: 'visit',
    surveyId: scope.surveyId,
    targetKeys,
    now: ctx.now(),
  })
  ctx.store.add({ userUuid: ctx.userUuid, suggestion })
}

export const entityWithoutKeyDetector: EventDetector = {
  kind: 'entityWithoutKey',
  area: 'design',
  needsDraft: true,
  on: ['designerLeft'],
  handle: handleEntityWithoutKey,
}

export const entityWithoutKeyResolver: TargetResolver = {
  kind: 'entityWithoutKey',
  isResolved: (targetKey, survey) => {
    const nodeDef = findDesignNodeDef(survey, targetKey)
    return !nodeDef || !isEntityWithoutKey(survey, nodeDef)
  },
}
