import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import { getExpressionProp } from '@webapp/ai/changeSets/expressionProps'
import { nodeDefExpressionProps } from '@webapp/ai/changeSets/types'

import { AiLimits } from '@common/ai/limits'

import type { AiTool } from '../types'
import {
  canViewSurveyTool,
  getDesignNodeDefs,
  getNodeDefPathNames,
  requireNodeDefByName,
  requireSurvey,
  toExpressionView,
} from './surveyLookup'

export const CHILDREN_MAX = 50
const RESULT_MAX_JSON_CHARS = AiLimits.assistantToolResultMaxChars - 500

/**
 * Returns the expressions of every expression property, as the model needs them.
 * @param {object} nodeDef - Node definition.
 * @returns {object} The expressions per property.
 */
const getExpressionsView = (nodeDef: any) => {
  const result: Record<string, object[]> = {}
  for (const prop of nodeDefExpressionProps) {
    result[prop] = getExpressionProp(nodeDef, prop).map(toExpressionView)
  }
  return result
}

/**
 * Returns the names of the design children of an entity.
 * @param {object} survey - Survey.
 * @param {object} nodeDef - Entity definition.
 * @returns {string[]} The child names.
 */
const getChildNames = (survey: any, nodeDef: any): string[] =>
  getDesignNodeDefs(survey)
    .filter((child) => NodeDef.getParentUuid(child) === NodeDef.getUuid(nodeDef))
    .map((child) => NodeDef.getName(child))

/**
 * Returns the child names of an entity, capped.
 * @param {object} survey - Survey.
 * @param {object} nodeDef - Entity definition.
 * @returns {object} `{ children, childrenTotal?, childrenTruncated? }`.
 */
const getChildrenView = (survey: any, nodeDef: any) => {
  const names = getChildNames(survey, nodeDef)
  return names.length > CHILDREN_MAX
    ? { children: names.slice(0, CHILDREN_MAX), childrenTotal: names.length, childrenTruncated: true }
    : { children: names }
}

/**
 * Describes one node definition in full for the model.
 * @param {object} survey - Survey.
 * @param {object} nodeDef - Node definition.
 * @returns {object} The description.
 */
export const describeNodeDef = (survey: any, nodeDef: any) => {
  const path = getNodeDefPathNames(survey, nodeDef)
  const validations = NodeDef.getValidations(nodeDef)
  return {
    name: NodeDef.getName(nodeDef),
    type: NodeDef.getType(nodeDef),
    path,
    parent: path.at(-1) ?? null,
    labels: NodeDef.getLabels(nodeDef),
    descriptions: NodeDef.getDescriptions(nodeDef),
    key: NodeDef.isKey(nodeDef),
    multiple: NodeDef.isMultiple(nodeDef),
    readOnly: NodeDef.isReadOnly(nodeDef),
    cycles: NodeDef.getCycles(nodeDef),
    required: NodeDefValidations.isRequired(validations),
    expressions: getExpressionsView(nodeDef),
    ...(NodeDef.isEntity(nodeDef) ? getChildrenView(survey, nodeDef) : {}),
  }
}

/**
 * Describes a node definition and keeps the result within the tool result budget (drops expression messages if needed).
 * @param {object} survey - Survey.
 * @param {object} nodeDef - Node definition.
 * @returns {object} The description.
 */
export const describeNodeDefWithinBudget = (survey: any, nodeDef: any) => {
  const description: any = describeNodeDef(survey, nodeDef)
  if (JSON.stringify(description).length <= RESULT_MAX_JSON_CHARS) return description
  const expressions: Record<string, object[]> = {}
  for (const [prop, views] of Object.entries(description.expressions as Record<string, any[]>)) {
    expressions[prop] = views.map(({ messages: _messages, ...rest }) => rest)
  }
  return { ...description, expressions, expressionMessagesOmitted: true }
}

export const nodeDefGetTool: AiTool<{ name: string }> = {
  name: 'nodeDef_get',
  description:
    'Returns one node definition by name: labels and descriptions per language, key / multiple / readOnly flags, ' +
    'its expressions (defaultValues, applicable, validations.expressions, visibleIf, editableIf), its parent path ' +
    'and, for entities, the child names. Call it before proposing a change to that node definition.',
  inputSchema: z.object({ name: z.string().min(1).max(100).describe('Node definition name, e.g. "tree_height"') }),
  area: ['design'],
  dataClass: 'schema',
  effect: 'read',
  requires: canViewSurveyTool,
  execute: async ({ name }, ctx) => {
    const survey = requireSurvey(ctx)
    return describeNodeDefWithinBudget(survey, requireNodeDefByName(survey, name))
  },
}
