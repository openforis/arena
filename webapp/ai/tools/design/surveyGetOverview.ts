import { z } from 'zod'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { canViewCurrentSurvey } from '../common/toolPermissions'
import { getResultBudget, takeWithinBudget } from '../common/toolResult'
import type { AiTool } from '../types'
import { describeNodeDefBrief, getDesignNodeDefsDepthFirst, requireNodeDefByName, requireSurvey } from './surveyLookup'

export const OVERVIEW_MAX_NODE_DEFS = 300

/**
 * Builds the survey overview: name, languages, cycles and the node definitions depth-first. A survey too large for
 * one result lists its entities, each with its number of attributes; an entity name lists the children of that entity.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {string|null} params.cycle - Current cycle.
 * @param {string} params.lang - Label language.
 * @param {string|null} [params.entity] - Entity whose children are listed (default: the whole survey).
 * @param {number} [params.maxNodeDefs] - Cap on the listed node definitions.
 * @param {number} [params.maxChars] - Maximum JSON length of the result (default: the budget).
 * @returns {object} The overview.
 */
export const buildSurveyOverview = ({
  survey,
  cycle,
  lang,
  entity = null,
  maxNodeDefs = OVERVIEW_MAX_NODE_DEFS,
  maxChars,
}: {
  survey: any
  cycle: string | null
  lang: string
  entity?: string | null
  maxNodeDefs?: number
  maxChars?: number
}) => {
  const info = Survey.getSurveyInfo(survey)
  const all = getDesignNodeDefsDepthFirst(survey)
  const childrenOf = (parent: any) => all.filter((def) => NodeDef.getParentUuid(def) === NodeDef.getUuid(parent))
  const listed = entity ? childrenOf(requireNodeDefByName(survey, entity)) : all
  const head = {
    name: Survey.getName(info),
    label: Survey.getLabel(info, lang) || null,
    languages: Survey.getLanguages(info),
    cycles: Survey.getCycleKeys(info),
    currentCycle: cycle,
    preferredLang: lang,
    ...(entity ? { entity } : {}),
    total: listed.length,
  }
  // add entries while the whole result stays within the budget
  const take = (nodeDefs: any[], toEntry: (nodeDef: any) => object, extra = {}) => {
    const overview = { ...head, ...extra, truncated: false, nodeDefs: [] }
    const entries = takeWithinBudget(nodeDefs.slice(0, maxNodeDefs), {
      baseChars: JSON.stringify(overview).length + 'true'.length,
      maxChars,
      toEntry,
    })
    return { ...overview, truncated: entries.length < nodeDefs.length, nodeDefs: entries }
  }
  const overview = take(listed, (nodeDef) => describeNodeDefBrief(survey, nodeDef, lang))
  if (entity || !overview.truncated) return overview
  // a large survey: the entities first, their attributes on demand
  const countAttributes = (parent: any) => childrenOf(parent).filter(NodeDef.isAttribute).length
  return take(
    all.filter(NodeDef.isEntity),
    (nodeDef) => ({
      ...describeNodeDefBrief(survey, nodeDef, lang),
      attributes: countAttributes(nodeDef),
      children: childrenOf(nodeDef).filter(NodeDef.isEntity).map(NodeDef.getName),
    }),
    {
      attributesOmitted: true,
      // a small model otherwise reads the entities one by one, whatever it was asked
      hint:
        'Call again with "entity" only when you need the attributes of one entity. Missing labels or descriptions, ' +
        'validation problems and record values have their own tools: call those, do not read the entities one by one.',
    }
  )
}

const inputSchema = z.object({
  entity: z
    .string()
    .max(100)
    .nullish()
    .describe('Optional: an entity name, to list only its attributes and child entities'),
})

export const surveyGetOverviewTool: AiTool<z.infer<typeof inputSchema>> = {
  name: 'survey_getOverview',
  description:
    'Returns the survey name, languages, cycles and all node definitions (entities and attributes) depth-first ' +
    'with name, type, label, parent, key and multiple flags. It gives the structure only: no descriptions, ' +
    'validation problems or record values, which have their own tools. ' +
    'A large survey returns only its entities, each with its number of attributes and the entities directly ' +
    'below it in "children" (attributesOmitted: true): ' +
    'call it again with "entity" to list the attributes of one entity.',
  inputSchema,
  area: ['design', 'analysis', 'cleaning'],
  dataClass: 'schema',
  requires: canViewCurrentSurvey,
  execute: async ({ entity }, ctx) =>
    buildSurveyOverview({
      survey: requireSurvey(ctx),
      cycle: ctx.cycle,
      lang: ctx.lang,
      entity,
      maxChars: getResultBudget(ctx),
    }),
}
