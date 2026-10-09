import { z } from 'zod'

import { toQuery } from '@common/ai/tasks/dataQuery'

import type { AiTool } from '@webapp/ai/tools/types'
import { getQueryChartType } from '@webapp/store/dataExplorer/explorerQuery'

import { canViewCurrentSurvey, getAnalysisContext } from './toolResults'

const MAX_ISSUES = 10
const MAX_ISSUE_CHARS = 300

const name = z.string().max(100)
const nameList = z.array(name).max(50).nullish()

// A's data-query JSON, without transforms (z.toJSONSchema cannot convert them)
export const proposeQueryInputSchema = z.object({
  entity: name.describe('Entity the query targets (one row per entity instance)'),
  mode: z.enum(['raw', 'aggregate']),
  attributes: nameList.describe('Raw mode: the attributes to show'),
  dimensions: nameList.describe('Aggregate mode: the attributes to group by'),
  measures: z
    .array(z.object({ attribute: name, functions: z.array(z.string().max(10)).max(6) }))
    .max(50)
    .nullish()
    .describe('Aggregate mode: the aggregated attributes and their functions (avg, cnt, max, med, min, sum)'),
  filter: z.string().max(1000).nullish().describe('Optional filter, e.g. dbh > 10 AND tree_status = "L"'),
  sort: z
    .array(z.object({ attribute: name, order: z.string().max(10).nullish() }))
    .max(10)
    .nullish()
    .describe('Optional sort: selected attributes (raw) or dimensions (aggregate), order asc or desc'),
  explanation: z.string().max(1000).describe("Short explanation of the query, in the user's language"),
})

export type ProposeQueryInput = z.infer<typeof proposeQueryInputSchema>

/**
 * Converts the tool input into the shape A's toQuery expects (lists never null).
 * @param {ProposeQueryInput} input - Tool input.
 * @returns {object} The data-query result.
 */
export const toDataQueryAiResult = (input: ProposeQueryInput) => ({
  entity: input.entity,
  mode: input.mode,
  attributes: input.attributes ?? [],
  dimensions: input.dimensions ?? [],
  measures: input.measures ?? [],
  filter: input.filter ?? null,
  sort: input.sort ?? [],
  explanation: input.explanation,
})

/**
 * Validates the proposed query and shows it to the user as a card.
 * @param {ProposeQueryInput} input - Tool input.
 * @param {object} ctx - Tool context (with the conversation's analysisQueries).
 * @returns {Promise<object>} The query id, or the reasons why the proposal is invalid.
 */
const execute = async (input: ProposeQueryInput, ctx: any) => {
  const store = ctx.analysisQueries
  if (!store) throw new Error('query_propose needs the conversation query store')
  const { survey, cycle, lang, includeAnalysis } = getAnalysisContext(ctx)
  const { query, errors } = toQuery({ survey, cycle, lang, aiResult: toDataQueryAiResult(input), includeAnalysis })
  if (!query) {
    return {
      error: {
        code: 'invalidProposal',
        message: 'The proposed query is not valid: fix the issues and propose it again.',
        issues: errors.slice(0, MAX_ISSUES).map((message) => ({ message: message.slice(0, MAX_ISSUE_CHARS) })),
      },
    }
  }
  const entry = store.add({ query, explanation: input.explanation, entityName: input.entity, mode: input.mode })
  return {
    queryId: entry.id,
    entity: input.entity,
    mode: input.mode,
    chartAvailable: getQueryChartType({ query, survey }) !== null,
    shownToUser: true,
  }
}

export const proposeQueryTool: AiTool<ProposeQueryInput, unknown> = {
  name: 'query_propose',
  description:
    'Proposes an Explorer query. It is validated and shown to the user as a card with "Open in Explorer" and, ' +
    'when possible, "Show as chart". Returns the query id (q1, q2, …) or the problems to fix.',
  inputSchema: proposeQueryInputSchema,
  area: ['analysis'],
  dataClass: 'schema',
  effect: 'propose',
  requires: canViewCurrentSurvey,
  execute,
}
