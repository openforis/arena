import { z } from 'zod'

import { toQuery } from '@common/ai/tasks/dataQuery'
import { canViewCurrentSurvey } from '@webapp/ai/tools/common/toolPermissions'
import type { AiTool } from '@webapp/ai/tools/types'
import { getQueryChartType } from '@webapp/store/dataExplorer/explorerQuery'

import { getAnalysisContext } from './toolResults'

const MAX_ISSUES = 10
const MAX_ISSUE_CHARS = 300

const name = z.string().max(100)
const nameList = z.array(name).max(50).nullish()

// the data-query JSON, without transforms (z.toJSONSchema cannot convert them)
export const proposeQueryInputSchema = z.object({
  entity: name.describe('Entity the query targets (one row per entity instance)'),
  mode: z.enum(['raw', 'aggregate']),
  attributes: nameList.describe('Raw mode: the attributes to show'),
  dimensions: nameList.describe('Aggregate mode: the attributes to group by; empty for one figure over all rows'),
  measures: z
    .array(z.object({ attribute: name.nullish(), functions: z.array(z.string().max(10)).max(6) }))
    .max(50)
    .nullish()
    .describe(
      'Aggregate mode: the aggregated attributes and their functions (avg, cnt, max, med, min, sum); to count the ' +
        'entity instances, the entity name with cnt'
    ),
  filter: z
    .string()
    .max(1000)
    .nullish()
    .describe('Optional filter in JavaScript syntax, e.g. dbh > 10 && tree_status == "L"'),
  sort: z
    .array(z.object({ attribute: name.nullish(), order: z.string().max(10).nullish() }))
    .max(10)
    .nullish()
    .describe(
      'Optional sort: selected attributes (raw) or dimensions and measures (aggregate; a measure is named by its ' +
        'attribute, or the entity name for the count), order asc or desc. Sort a measure desc to get the top groups, ' +
        'e.g. the species with most trees'
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .nullish()
    .describe(
      'Optional: the maximum number of rows of the result (the first N after the sort). For a "top N" question set ' +
        'it to N, with a sort'
    ),
  explanation: z.string().max(1000).describe("Short explanation of the query, in the user's language"),
})

export type ProposeQueryInput = z.infer<typeof proposeQueryInputSchema>

/**
 * Converts the tool input into the shape toQuery expects (lists never null).
 * @param {ProposeQueryInput} input - Tool input.
 * @returns {object} The data-query result.
 */
export const toDataQueryAiResult = (input: ProposeQueryInput) => {
  // small models leave the attribute of the count empty: it counts the entity
  const measures = (input.measures ?? []).map((measure) => ({
    ...measure,
    attribute: measure.attribute ?? input.entity,
  }))
  // a sort without attribute is the sort of the only measure (e.g. the top groups); dropped when it cannot be told
  const measureAttribute = measures.length === 1 ? measures[0].attribute : null
  const sort = (input.sort ?? []).flatMap((item) => {
    const attribute = item.attribute ?? measureAttribute
    return attribute ? [{ ...item, attribute }] : []
  })
  return {
    entity: input.entity,
    mode: input.mode,
    attributes: input.attributes ?? [],
    dimensions: input.dimensions ?? [],
    measures,
    filter: input.filter ?? null,
    sort,
    explanation: input.explanation,
  }
}

/**
 * Validates the proposed query and shows it to the user as a card.
 * @param {ProposeQueryInput} input - Tool input.
 * @param {object} ctx - Tool context (with the conversation's analysisQueries).
 * @returns {object} The query id, or the reasons why the proposal is invalid.
 */
const proposeQuery = (input: ProposeQueryInput, ctx: any) => {
  const store = ctx.analysisQueries
  if (!store) throw new Error('query_propose needs the conversation query store')
  const { survey, cycle, lang, includeAnalysis } = getAnalysisContext(ctx)
  const aiResult = toDataQueryAiResult(input)
  const { query, errors } = toQuery({ survey, cycle, lang, aiResult, includeAnalysis })
  // without a sort the first N rows are arbitrary ones
  if (input.limit && aiResult.sort.length === 0)
    errors.push('a limit needs a sort: add the sort that defines the first rows')
  if (!query || errors.length > 0) {
    return {
      error: {
        code: 'invalidProposal',
        message: 'The proposed query is not valid: fix the issues and propose it again.',
        issues: errors.slice(0, MAX_ISSUES).map((message) => ({ message: message.slice(0, MAX_ISSUE_CHARS) })),
      },
    }
  }
  const entry = store.add({
    query,
    explanation: input.explanation,
    entityName: input.entity,
    mode: input.mode,
    ...(input.limit ? { limit: input.limit } : {}),
  })
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
  area: ['analysis', 'cleaning'],
  dataClass: 'schema',
  requires: canViewCurrentSurvey,
  // synchronous work: a throw still becomes a rejection, as with an async function
  execute: (input, ctx) => Promise.resolve().then(() => proposeQuery(input, ctx)),
}
