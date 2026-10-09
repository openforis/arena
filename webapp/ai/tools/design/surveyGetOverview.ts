import { z } from 'zod'

import * as Survey from '@core/survey/survey'

import type { AiTool } from '../types'
import { canViewSurveyTool, describeNodeDefBrief, getDesignNodeDefsDepthFirst, requireSurvey } from './surveyLookup'

export const OVERVIEW_MAX_NODE_DEFS = 300

/**
 * Builds the survey overview: name, languages, cycles and the node definitions depth-first.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {string|null} params.cycle - Current cycle.
 * @param {string} params.lang - Label language.
 * @param {number} [params.maxNodeDefs] - Cap on the listed node definitions.
 * @returns {object} The overview.
 */
export const buildSurveyOverview = ({
  survey,
  cycle,
  lang,
  maxNodeDefs = OVERVIEW_MAX_NODE_DEFS,
}: {
  survey: any
  cycle: string | null
  lang: string
  maxNodeDefs?: number
}) => {
  const info = Survey.getSurveyInfo(survey)
  const ordered = getDesignNodeDefsDepthFirst(survey)
  return {
    name: Survey.getName(info),
    label: Survey.getLabel(info, lang) || null,
    languages: Survey.getLanguages(info),
    cycles: Survey.getCycleKeys(info),
    currentCycle: cycle,
    preferredLang: lang,
    total: ordered.length,
    truncated: ordered.length > maxNodeDefs,
    nodeDefs: ordered.slice(0, maxNodeDefs).map((nodeDef) => describeNodeDefBrief(survey, nodeDef, lang)),
  }
}

export const surveyGetOverviewTool: AiTool<Record<string, never>> = {
  name: 'survey_getOverview',
  description:
    'Returns the survey name, languages, cycles and all node definitions (entities and attributes) depth-first ' +
    'with name, type, label, parent, key and multiple flags. Call it first to learn the survey structure.',
  inputSchema: z.object({}).strict(),
  area: ['design'],
  dataClass: 'schema',
  effect: 'read',
  requires: canViewSurveyTool,
  execute: async (_input, ctx) => buildSurveyOverview({ survey: requireSurvey(ctx), cycle: ctx.cycle, lang: ctx.lang }),
}
