/**
 * Helpers shared by the Design detectors, resolvers and definitions.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { isDesignNodeDef } from '@webapp/ai/tools/design/surveyLookup'

import type { AssistantSuggestion, SuggestionKind } from '../types'
import type { DetectorContext } from './types'

export type DesignDetectorScope = { survey: any; surveyId: number }

/**
 * Returns the survey to inspect when Design detectors may run: a draft generation of a user who can edit.
 * @param {DetectorContext} ctx - Detector context.
 * @returns {DesignDetectorScope|null} The survey and its id; null when they must not run.
 */
export const getDesignDetectorScope = (ctx: DetectorContext): DesignDetectorScope | null => {
  const { generation, survey } = ctx
  if (!generation || !survey || !generation.draft || !generation.canEditSurvey) return null
  return { survey, surveyId: generation.surveyId }
}

/**
 * Builds a Design suggestion (cycle-independent, no expiry).
 * @param {object} params - Parameters.
 * @param {SuggestionKind} params.kind - Kind.
 * @param {string} params.scopeKey - Id part after the kind.
 * @param {number} params.surveyId - Survey id.
 * @param {string[]} params.targetKeys - Target keys.
 * @param {Date} params.now - Creation time.
 * @returns {AssistantSuggestion} The suggestion.
 */
export const newDesignSuggestion = ({
  kind,
  scopeKey,
  surveyId,
  targetKeys,
  now,
}: {
  kind: SuggestionKind
  scopeKey: string
  surveyId: number
  targetKeys: string[]
  now: Date
}): AssistantSuggestion => ({
  id: `${kind}:${scopeKey}`,
  kind,
  area: 'design',
  surveyId,
  cycle: null,
  targets: targetKeys.map((key) => ({ key })),
  createdAt: now.toISOString(),
  expiresAt: null,
})

/**
 * Returns an eligible node definition by uuid.
 * @param {object} survey - Survey.
 * @param {string} uuid - Node definition uuid.
 * @returns {object|null} The node definition; null when missing, deleted or not a design one.
 */
export const findDesignNodeDef = (survey: any, uuid: string): any | null => {
  const nodeDef = Survey.getNodeDefByUuid(uuid)(survey)
  return nodeDef && isDesignNodeDef(nodeDef) ? nodeDef : null
}

/**
 * Returns the node definitions of a designer visit that are eligible and saved.
 * @param {object} survey - Survey.
 * @param {string[]} uuids - Uuids created during the visit.
 * @returns {object[]} The node definitions, in the given order.
 */
export const getNewSavedDesignNodeDefs = (survey: any, uuids: string[]): any[] =>
  uuids
    .map((uuid) => findDesignNodeDef(survey, uuid))
    .filter((nodeDef) => nodeDef !== null && !NodeDef.isTemporary(nodeDef))

/**
 * Returns the node definition uuid of a target key (`<uuid>` or `<uuid>:<kind>`).
 * @param {string} targetKey - Target key.
 * @returns {string} The uuid.
 */
export const getTargetNodeDefUuid = (targetKey: string): string => targetKey.split(':')[0]

/**
 * Returns the part of a suggestion id after the kind ('missingTranslations:fr' → 'fr').
 * @param {string} id - Suggestion id.
 * @returns {string} The scope key.
 */
export const getSuggestionScopeKey = (id: string): string => id.slice(id.indexOf(':') + 1)
