/**
 * Node definitions of a Design suggestion's visible targets, for cards and prompts.
 */
import * as NodeDef from '@core/survey/nodeDef'

import { findDesignNodeDef, getTargetNodeDefUuid } from '../detectors/designTargets'
import type { AssistantSuggestion } from '../types'

/**
 * Returns the node definitions of the targets that still exist.
 * @param {AssistantSuggestion} suggestion - Suggestion (visible targets).
 * @param {object|null} survey - Survey.
 * @returns {object[]} The node definitions, in target order.
 */
export const getTargetNodeDefs = (suggestion: AssistantSuggestion, survey: any | null): any[] => {
  if (!survey) return []
  return suggestion.targets
    .map((target) => findDesignNodeDef(survey, getTargetNodeDefUuid(target.key)))
    .filter((nodeDef) => nodeDef !== null)
}

/**
 * Returns the names of the targets that still exist.
 * @param {AssistantSuggestion} suggestion - Suggestion (visible targets).
 * @param {object|null} survey - Survey.
 * @returns {string[]} The names.
 */
export const getTargetNodeDefNames = (suggestion: AssistantSuggestion, survey: any | null): string[] =>
  getTargetNodeDefs(suggestion, survey).map((nodeDef) => NodeDef.getName(nodeDef))
