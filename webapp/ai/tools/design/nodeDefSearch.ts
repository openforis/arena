import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'

import type { AiTool } from '../types'
import { canViewSurveyTool, describeNodeDefBrief, getDesignNodeDefsDepthFirst, requireSurvey } from './surveyLookup'

export const SEARCH_MAX_RESULTS = 20

/**
 * Returns true when the name or a label contains the (lower-case) text.
 * @param {object} nodeDef - Node definition.
 * @param {string} text - Lower-case text.
 * @returns {boolean} True when it matches.
 */
const matches = (nodeDef: any, text: string): boolean => {
  const candidates = [NodeDef.getName(nodeDef), ...Object.values(NodeDef.getLabels(nodeDef) as Record<string, string>)]
  return candidates.some((candidate) => String(candidate).toLowerCase().includes(text))
}

export const nodeDefSearchTool: AiTool<{ text: string }> = {
  name: 'nodeDef_search',
  description:
    'Finds node definitions whose name or label (any language) contains the text, case-insensitive. ' +
    `Returns at most ${SEARCH_MAX_RESULTS}.`,
  inputSchema: z.object({ text: z.string().trim().min(1).max(200).describe('Text to look for') }),
  area: ['design', 'analysis', 'cleaning'],
  dataClass: 'schema',
  effect: 'read',
  requires: canViewSurveyTool,
  execute: async ({ text }, ctx) => {
    const survey = requireSurvey(ctx)
    const lowerText = text.toLowerCase()
    const found = getDesignNodeDefsDepthFirst(survey).filter((nodeDef) => matches(nodeDef, lowerText))
    return {
      results: found.slice(0, SEARCH_MAX_RESULTS).map((nodeDef) => describeNodeDefBrief(survey, nodeDef, ctx.lang)),
      truncated: found.length > SEARCH_MAX_RESULTS,
    }
  },
}
