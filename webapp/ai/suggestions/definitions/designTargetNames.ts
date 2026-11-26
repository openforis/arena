/**
 * Node definitions of a Design suggestion's visible targets, for cards and prompts.
 */
import * as NodeDef from '@core/survey/nodeDef'
import { findDesignNodeDef, getTargetNodeDefUuid } from '../detectors/designTargets'
import type { AssistantSuggestion } from '../types'

/**
 * Returns the node definitions of the targets that still exist.
 * @param {AssistantSuggestion} suggestion - Suggestion (visible targets).
 * @returns {object[]} The node definitions, in target order.
 */
export const getTargetNodeDefs = (suggestion: AssistantSuggestion, survey: any): any[] => {
  if (!survey) return []
  return suggestion.targets
    .map((target) => findDesignNodeDef(survey, getTargetNodeDefUuid(target.key)))
    .filter((nodeDef) => nodeDef !== null)
}

/**
 * Returns the names of the targets that still exist.
 * @param {AssistantSuggestion} suggestion - Suggestion (visible targets).
 */
export const getTargetNodeDefNames = (suggestion: AssistantSuggestion, survey: any): string[] =>
  getTargetNodeDefs(suggestion, survey).map((nodeDef) => NodeDef.getName(nodeDef))
