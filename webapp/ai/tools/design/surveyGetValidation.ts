import { z } from 'zod'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { collectNodeDefIssues, type NodeDefIssue } from '@webapp/ai/changeSets/validationIssues'

import { AiLimits } from '@common/ai/limits'

import type { AiTool } from '../types'
import {
  canViewSurveyTool,
  getDesignNodeDefsDepthFirst,
  getNodeDefPathNames,
  requireNodeDefByName,
  requireSurvey,
} from './surveyLookup'

type Translate = (key: string, params?: Record<string, unknown>) => string

export const VALIDATION_MAX_NODE_DEFS = 50
const RESULT_MAX_JSON_CHARS = AiLimits.assistantToolResultMaxChars - 500

const keepKey = (key: string): string => key

/**
 * Returns the stored design errors and warnings of a node definition (the ones the designer shows).
 * @param {object} survey - Survey.
 * @param {object} nodeDef - Node definition.
 * @param {Translate} t - Translator.
 * @returns {NodeDefIssue[]} The issues.
 */
export const getNodeDefIssues = (survey: any, nodeDef: any, t: Translate): NodeDefIssue[] =>
  collectNodeDefIssues(Survey.getNodeDefValidation(nodeDef)(survey), t)

/**
 * Returns the node definitions with design errors or warnings, depth-first.
 * @param {object} survey - Survey.
 * @returns {object[]} The node definitions.
 */
const getNodeDefsWithIssues = (survey: any): any[] =>
  getDesignNodeDefsDepthFirst(survey).filter((nodeDef) => getNodeDefIssues(survey, nodeDef, keepKey).length > 0)

/**
 * Returns the names of the node definitions with design errors or warnings, depth-first.
 * @param {object|null} survey - Survey.
 * @returns {string[]} The names.
 */
export const getNodeDefNamesWithIssues = (survey: any): string[] =>
  survey ? getNodeDefsWithIssues(survey).map((nodeDef) => NodeDef.getName(nodeDef)) : []

const describeIssues = (survey: any, nodeDef: any, t: Translate) => ({
  name: NodeDef.getName(nodeDef),
  type: NodeDef.getType(nodeDef),
  path: getNodeDefPathNames(survey, nodeDef),
  issues: getNodeDefIssues(survey, nodeDef, t),
})

/**
 * Builds the list of the node definitions with design errors or warnings, within the result budget.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {Translate} params.t - Translator.
 * @param {number} [params.maxNodeDefs] - Cap on the listed node definitions.
 * @returns {object} `{ total, truncated, nodeDefs }`.
 */
export const buildSurveyValidation = ({
  survey,
  t,
  maxNodeDefs = VALIDATION_MAX_NODE_DEFS,
}: {
  survey: any
  t: Translate
  maxNodeDefs?: number
}) => {
  const withIssues = getNodeDefsWithIssues(survey)
  const result = { total: withIssues.length, truncated: false, nodeDefs: [] as object[] }
  let size = JSON.stringify(result).length + 'true'.length
  for (const nodeDef of withIssues.slice(0, maxNodeDefs)) {
    const entry = describeIssues(survey, nodeDef, t)
    size += JSON.stringify(entry).length + 1
    if (size > RESULT_MAX_JSON_CHARS) break
    result.nodeDefs.push(entry)
  }
  result.truncated = result.nodeDefs.length < withIssues.length
  return result
}

export const surveyGetValidationTool: AiTool<{ name?: string }> = {
  name: 'survey_getValidation',
  description:
    'Returns the design errors and warnings the user sees in the form designer (warning icons and red messages), ' +
    'per node definition: name, type, parent path and issues (field, severity, message). Without a name it lists ' +
    'every node definition with issues. Call it when the user asks about an error or warning on screen.',
  inputSchema: z.object({
    name: z.string().min(1).max(100).optional().describe('Node definition name, e.g. "tree"; omit for all'),
  }),
  area: ['design'],
  dataClass: 'schema',
  effect: 'read',
  requires: canViewSurveyTool,
  execute: async ({ name }, ctx) => {
    const survey = requireSurvey(ctx)
    if (!name) return buildSurveyValidation({ survey, t: ctx.t })
    const entry = describeIssues(survey, requireNodeDefByName(survey, name), ctx.t)
    return { total: entry.issues.length > 0 ? 1 : 0, truncated: false, nodeDefs: [entry] }
  },
}
