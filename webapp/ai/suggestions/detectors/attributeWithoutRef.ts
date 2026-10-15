/**
 * Attribute without a reference suggestion: code attributes without a category and taxon attributes without a taxonomy (imported surveys, older
 * data). A state detector over the whole survey; only attributes whose list the designer lets change.
 */
import * as NodeDef from '@core/survey/nodeDef'

import { canUpdateNodeDefRef } from '@webapp/ai/changeSets/operations'
import type { NodeDefRefProp } from '@webapp/ai/changeSets/types'
import { getDesignNodeDefsDepthFirst } from '@webapp/ai/tools/design/surveyLookup'

import type { AssistantSuggestion } from '../types'
import { getDesignDetectorScope, newDesignSuggestion } from './designTargets'
import type { DetectorContext, StateDetector } from './types'

/**
 * Returns the reference a code or taxon attribute lacks.
 * @param {object} nodeDef - Node definition.
 * @returns {NodeDefRefProp|null} categoryUuid or taxonomyUuid; null when nothing is missing.
 */
export const getMissingRefProp = (nodeDef: any): NodeDefRefProp | null => {
  if (NodeDef.isCode(nodeDef)) return NodeDef.getCategoryUuid(nodeDef) ? null : 'categoryUuid'
  if (NodeDef.isTaxon(nodeDef)) return NodeDef.getTaxonomyUuid(nodeDef) ? null : 'taxonomyUuid'
  return null
}

/**
 * Returns the saved, eligible attributes without their category or taxonomy that may get one.
 * @param {object} survey - Survey.
 * @returns {object[]} The node definitions, in hierarchy order.
 */
export const findAttributesWithoutRef = (survey: any): any[] =>
  getDesignNodeDefsDepthFirst(survey).filter((nodeDef) => {
    if (NodeDef.isTemporary(nodeDef)) return false
    const prop = getMissingRefProp(nodeDef)
    return prop !== null && canUpdateNodeDefRef(survey, nodeDef, prop)
  })

/**
 * Detects the attributes without a category or taxonomy.
 * @param {DetectorContext} ctx - Detector context.
 * @returns {AssistantSuggestion[]} One suggestion, or none.
 */
export const detectAttributeWithoutRef = (ctx: DetectorContext): AssistantSuggestion[] => {
  const scope = getDesignDetectorScope(ctx)
  if (!scope) return []
  const targetKeys = findAttributesWithoutRef(scope.survey).map((nodeDef) => NodeDef.getUuid(nodeDef))
  if (targetKeys.length === 0) return []
  return [
    newDesignSuggestion({
      kind: 'attributeWithoutRef',
      scopeKey: 'survey',
      surveyId: scope.surveyId,
      targetKeys,
      now: ctx.now(),
    }),
  ]
}

export const attributeWithoutRefDetector: StateDetector = {
  kind: 'attributeWithoutRef',
  area: 'design',
  needsDraft: true,
  detect: detectAttributeWithoutRef,
}
