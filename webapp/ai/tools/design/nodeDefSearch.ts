import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'

import type { AiTool } from '../types'
import { canViewSurveyTool, describeNodeDefBrief, getDesignNodeDefsDepthFirst, requireSurvey } from './surveyLookup'

export const SEARCH_MAX_RESULTS = 20

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
  area: ['design'],
  dataClass: 'schema',
  effect: 'read',
  requires: canViewSurveyTool,
  execute: async ({ text }, ctx) => {
    const survey = requireSurvey(ctx)
    const found = getDesignNodeDefsDepthFirst(survey).filter((nodeDef) => matches(nodeDef, text.toLowerCase()))
    return {
      results: found.slice(0, SEARCH_MAX_RESULTS).map((nodeDef) => describeNodeDefBrief(survey, nodeDef, ctx.lang)),
      truncated: found.length > SEARCH_MAX_RESULTS,
    }
  },
}
