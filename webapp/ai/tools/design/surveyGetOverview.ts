import { z } from 'zod'

import * as Survey from '@core/survey/survey'

import { AiLimits } from '@common/ai/limits'

import type { AiTool } from '../types'
import { canViewSurveyTool, describeNodeDefBrief, getDesignNodeDefsDepthFirst, requireSurvey } from './surveyLookup'

export const OVERVIEW_MAX_NODE_DEFS = 300
// the wrapper cuts longer results into a non-JSON string: stay under the limit with some margin
export const OVERVIEW_MAX_JSON_CHARS = AiLimits.assistantToolResultMaxChars - 500

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
  const overview = {
    name: Survey.getName(info),
    label: Survey.getLabel(info, lang) || null,
    languages: Survey.getLanguages(info),
    cycles: Survey.getCycleKeys(info),
    currentCycle: cycle,
    preferredLang: lang,
    total: ordered.length,
    truncated: false,
    nodeDefs: [] as object[],
  }
  // add entries while the whole result stays within the budget
  let size = JSON.stringify(overview).length + 'true'.length
  for (const nodeDef of ordered.slice(0, maxNodeDefs)) {
    const entry = describeNodeDefBrief(survey, nodeDef, lang)
    size += JSON.stringify(entry).length + 1
    if (size > OVERVIEW_MAX_JSON_CHARS) break
    overview.nodeDefs.push(entry)
  }
  overview.truncated = overview.nodeDefs.length < ordered.length
  return overview
}

export const surveyGetOverviewTool: AiTool<Record<string, never>> = {
  name: 'survey_getOverview',
  description:
    'Returns the survey name, languages, cycles and all node definitions (entities and attributes) depth-first ' +
    'with name, type, label, parent, key and multiple flags. Call it first to learn the survey structure.',
  inputSchema: z.object({}).strict(),
  area: ['design', 'analysis', 'cleaning'],
  dataClass: 'schema',
  effect: 'read',
  requires: canViewSurveyTool,
  execute: async (_input, ctx) => buildSurveyOverview({ survey: requireSurvey(ctx), cycle: ctx.cycle, lang: ctx.lang }),
}
