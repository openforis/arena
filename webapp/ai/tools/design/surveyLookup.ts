/**
 * Node definition helpers of the design tools (the lookup by name is shared: ../common/nodeDefLookup).
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'

import { findNodeDefByName, getCurrentNodeDefs, isCurrentNodeDef } from '../common/nodeDefLookup'
import { AiToolFailure } from '../toolFailure'
import type { AiToolContext } from '../types'

/**
 * Returns true for node definitions the Design assistant works with (no analysis, virtual or layout items).
 * @param {object} nodeDef - Node definition.
 * @returns {boolean} True when it is a design node definition.
 */
export const isDesignNodeDef = (nodeDef: any): boolean => isCurrentNodeDef(nodeDef)

/**
 * Returns the design node definitions of the survey.
 * @param {object} survey - Survey.
 * @returns {object[]} The node definitions.
 */
export const getDesignNodeDefs = (survey: any): any[] => getCurrentNodeDefs(survey)

/**
 * Groups node definitions by parent uuid (null for the root).
 * @param {object[]} nodeDefs - Node definitions.
 * @returns {Map<string|null, object[]>} The children per parent.
 */
const groupByParent = (nodeDefs: any[]): Map<string | null, any[]> => {
  const result = new Map<string | null, any[]>()
  for (const nodeDef of nodeDefs) {
    const parentUuid = NodeDef.getParentUuid(nodeDef) ?? null
    result.set(parentUuid, [...(result.get(parentUuid) ?? []), nodeDef])
  }
  return result
}

/**
 * Orders the grouped node definitions depth-first.
 * @param {Map<string|null, object[]>} childrenByParent - Children per parent uuid.
 * @returns {object[]} The node definitions, each followed by its descendants.
 */
const depthFirst = (childrenByParent: Map<string | null, any[]>): any[] => {
  const result: any[] = []
  const stack = [...(childrenByParent.get(null) ?? [])].reverse()
  while (stack.length > 0) {
    const nodeDef = stack.pop()
    result.push(nodeDef)
    stack.push(...[...(childrenByParent.get(NodeDef.getUuid(nodeDef)) ?? [])].reverse())
  }
  return result
}

/**
 * Returns the design node definitions depth-first (each entity followed by its descendants).
 * @param {object} survey - Survey.
 * @returns {object[]} The node definitions.
 */
export const getDesignNodeDefsDepthFirst = (survey: any): any[] => depthFirst(groupByParent(getDesignNodeDefs(survey)))

/**
 * Returns the edit distance between two strings.
 * @param {string} a - First string.
 * @param {string} b - Second string.
 * @returns {number} The distance.
 */
const levenshtein = (a: string, b: string): number => {
  let previous = Array.from({ length: b.length + 1 }, (_value, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
    }
    previous = current
  }
  return previous[b.length]
}

/**
 * Returns the names closest to the given one (edit distance, then name order).
 * @param {object} survey - Survey.
 * @param {string} name - Unknown name.
 * @param {number} [max] - Maximum number of names.
 * @returns {string[]} The closest names.
 */
export const getClosestNames = (survey: any, name: string, max = 5): string[] =>
  getDesignNodeDefs(survey)
    .map((nodeDef) => NodeDef.getName(nodeDef))
    .map((candidate) => ({ candidate, distance: levenshtein(name.toLowerCase(), candidate.toLowerCase()) }))
    .sort((a, b) => a.distance - b.distance || a.candidate.localeCompare(b.candidate))
    .slice(0, max)
    .map(({ candidate }) => candidate)

/**
 * Returns the node definition with the given name, or throws nodeDefNotFound with the closest names.
 * @param {object} survey - Survey.
 * @param {string} name - Name.
 * @returns {object} The node definition.
 */
export const requireNodeDefByName = (survey: any, name: string): any => {
  const nodeDef = findNodeDefByName(survey, name)
  if (nodeDef) return nodeDef
  throw new AiToolFailure('nodeDefNotFound', `There is no node definition named "${name}".`, {
    closestNames: getClosestNames(survey, name),
  })
}

/**
 * Returns the survey of the context, or throws noSurvey.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {object} The survey.
 */
export const requireSurvey = (ctx: AiToolContext): any => {
  if (ctx.survey) return ctx.survey
  throw new AiToolFailure('noSurvey', 'No survey is open.')
}

/**
 * Returns the names from the root to the node definition's parent.
 * @param {object} survey - Survey.
 * @param {object} nodeDef - Node definition.
 * @returns {string[]} The ancestor names, root first.
 */
export const getNodeDefPathNames = (survey: any, nodeDef: any): string[] => {
  const names: string[] = []
  let parent = Survey.getNodeDefParent(nodeDef)(survey)
  while (parent) {
    names.unshift(NodeDef.getName(parent))
    parent = Survey.getNodeDefParent(parent)(survey)
  }
  return names
}

/**
 * Returns the label of a node definition in a language, or null.
 * @param {object} nodeDef - Node definition.
 * @param {string} lang - Language.
 * @returns {string|null} The label.
 */
export const getLabelOrNull = (nodeDef: any, lang: string): string | null => NodeDef.getLabels(nodeDef)[lang] || null

/**
 * Returns a short description of a node definition (name, type, label, parent, key and multiple flags when set).
 * @param {object} survey - Survey.
 * @param {object} nodeDef - Node definition.
 * @param {string} lang - Label language.
 * @returns {object} The description.
 */
export const describeNodeDefBrief = (survey: any, nodeDef: any, lang: string) => {
  const parent = Survey.getNodeDefParent(nodeDef)(survey)
  return {
    name: NodeDef.getName(nodeDef),
    type: NodeDef.getType(nodeDef),
    label: getLabelOrNull(nodeDef, lang),
    ...(parent ? { parent: NodeDef.getName(parent) } : {}),
    ...(NodeDef.isKey(nodeDef) ? { key: true } : {}),
    ...(NodeDef.isMultiple(nodeDef) ? { multiple: true } : {}),
  }
}

/**
 * Returns the parts of an expression the model needs (no uuid, no empty fields).
 * @param {object} expression - Node definition expression.
 * @returns {object} `{ expression, applyIf?, severity?, messages? }`.
 */
export const toExpressionView = (expression: any) => {
  const applyIf = NodeDefExpression.getApplyIf(expression)
  const messages = NodeDefExpression.getMessages(expression)
  return {
    expression: NodeDefExpression.getExpression(expression),
    ...(applyIf ? { applyIf } : {}),
    ...(expression?.severity ? { severity: expression.severity } : {}),
    ...(Object.keys(messages).length > 0 ? { messages } : {}),
  }
}
