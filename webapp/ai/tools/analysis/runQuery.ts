import { z } from 'zod'

import { Query } from '@common/model/query'

import { fitListToBudget, getResultBudget } from '@webapp/ai/tools/common/toolResult'
import { AiToolFailure } from '@webapp/ai/tools/toolFailure'
import { canViewCurrentSurvey } from '@webapp/ai/tools/common/toolPermissions'
import type { AiTool } from '@webapp/ai/tools/types'

import type { AnalysisApi } from './analysisApi'
import { getQueryResultColumns, type QueryResultColumn, toResultRows } from './queryResult'
import { getAnalysisContext, toRequestFailure } from './toolResults'

export const aggregateRowsMax = 200
export const rawRowsMax = 50
const NOTE_RESERVE_CHARS = 450
export const NO_VALUE = '(no value)'

const inputSchema = z.object({
  queryId: z.string().max(20).describe('Id returned by query_propose (q1, q2, …)'),
})

type Input = z.infer<typeof inputSchema>

/**
 * Returns the failure for a query id that was not proposed in this conversation.
 * @param {string} queryId - The id.
 * @returns {AiToolFailure} The failure to throw.
 */
const unknownQuery = (queryId: string) =>
  new AiToolFailure(
    'unknownQuery',
    `Unknown query "${queryId}": propose it with query_propose and use the returned queryId`
  )

/**
 * Turns an expected request failure into a failure the model can act on.
 * @param {any} error - The error.
 * @returns {Error} The error to throw.
 */
const toQueryFailure = (error: any) =>
  toRequestFailure(error, 'The query took too long. Aggregate the data or add a filter, then propose a new query.')

/**
 * Returns the request parameters of a stored query.
 * @param {object} ctx - Tool context.
 * @param {object} entry - Stored query.
 * @returns {object} Survey id, cycle, query and signal.
 */
const getRequestParams = (ctx: any, entry: any) => {
  const { surveyId, cycle } = getAnalysisContext(ctx)
  return { surveyId, cycle, query: entry.query, signal: ctx.signal }
}

/**
 * Fetches at most max rows (asking one more to know whether there are others) and the total.
 * @param {object} params - Parameters.
 * @param {AnalysisApi} params.api - Analysis API.
 * @param {object} params.requestParams - Request parameters.
 * @param {number} params.max - Row cap.
 * @returns {Promise<object>} Rows, total and truncated flag.
 */
const fetchCappedRows = async ({ api, requestParams, max }: { api: AnalysisApi; requestParams: any; max: number }) => {
  const rows = await api.fetchQueryRows({ ...requestParams, limit: max + 1 })
  const truncated = rows.length > max
  const total = truncated ? await api.fetchQueryCount(requestParams) : rows.length
  return { rows: rows.slice(0, max), total, truncated }
}

/**
 * Tells the model what the shown rows are, so that it does not rank or total a subset.
 * @param {object} params - Parameters.
 * @param {number} params.shown - Rows in the result.
 * @param {number} params.total - Rows of the query.
 * @param {boolean} params.sorted - Whether the query has a sort.
 * @param {boolean} params.hasTotals - Whether the result has the totals.
 * @returns {string} The note.
 */
const getTruncationNote = ({
  shown,
  total,
  sorted,
  hasTotals,
}: {
  shown: number
  total: number
  sorted: boolean
  hasTotals: boolean
}): string => {
  const subset = sorted
    ? `Only the first ${shown} of ${total} rows are shown, in the sort order of the query: they are its top rows.`
    : `Only ${shown} of ${total} rows are shown, in no order: do not rank them. For the top rows, propose the ` +
      'query with a sort (a measure desc) and a limit.'
  const overall = hasTotals ? 'Overall figures are in "totals"' : 'For an overall figure, propose an aggregate query'
  return `${subset} ${overall}: never add or average the rows yourself, and never conclude from rows not shown.`
}

/**
 * Fetches the measures of an aggregate query over all its rows (the same query without dimensions).
 * @param {object} params - Parameters.
 * @param {AnalysisApi} params.api - Analysis API.
 * @param {object} params.requestParams - Request parameters.
 * @param {QueryResultColumn[]} params.columns - Result columns.
 * @returns {Promise<object|null>} The totals by measure column, or null when they could not be computed.
 */
const fetchTotals = async ({
  api,
  requestParams,
  columns,
}: {
  api: AnalysisApi
  requestParams: any
  columns: QueryResultColumn[]
}): Promise<Record<string, unknown> | null> => {
  const query = Query.assocSort([])(Query.assocDimensions([])(requestParams.query))
  try {
    const [row] = await api.fetchQueryRows({ ...requestParams, query, limit: 1 })
    if (!row) return null
    return Object.fromEntries(columns.filter((column) => column.fn).map(({ name }) => [name, row[name] ?? null]))
  } catch (error) {
    if (requestParams.signal?.aborted) throw error
    // the rows are still worth returning without the totals
    return null
  }
}

/**
 * Marks the groups without a value, so that the model does not drop them: the first column of each dimension.
 * @param {object} params - Parameters.
 * @param {unknown[][]} params.rows - Result rows.
 * @param {QueryResultColumn[]} params.columns - Result columns.
 * @returns {unknown[][]} The rows.
 */
const markEmptyGroups = ({ rows, columns }: { rows: unknown[][]; columns: QueryResultColumn[] }): unknown[][] => {
  const isGroupKey = columns.map(({ fn, attribute }, idx) => !fn && columns[idx - 1]?.attribute !== attribute)
  return rows.map((row) => row.map((value, idx) => (value === null && isGroupKey[idx] ? NO_VALUE : value)))
}

/**
 * Creates query_count and query_run.
 * @param {object} params - Parameters.
 * @param {AnalysisApi} params.api - Analysis API.
 * @returns {AiTool[]} The two tools.
 */
export const createRunQueryTools = ({ api }: { api: AnalysisApi }): AiTool<Input, unknown>[] => {
  const common: Pick<AiTool<Input>, 'inputSchema' | 'area' | 'dataClass' | 'requires'> = {
    inputSchema,
    area: ['analysis', 'cleaning'],
    dataClass: 'data',
    requires: canViewCurrentSurvey,
  }

  const countTool: AiTool<Input, unknown> = {
    ...common,
    name: 'query_count',
    description: 'Counts the rows (raw mode) or the groups (aggregate mode) of a proposed query.',
    /**
     * Counts a proposed query.
     * @param {Input} input - Tool input.
     * @param {object} ctx - Tool context.
     * @returns {Promise<object>} The result, or an error result.
     */
    execute: async ({ queryId }, ctx) => {
      const entry = ctx.analysisQueries?.get(queryId)
      if (!entry) throw unknownQuery(queryId)
      try {
        const total = await api.fetchQueryCount(getRequestParams(ctx, entry))
        return { queryId, mode: entry.mode, total }
      } catch (error) {
        throw toQueryFailure(error)
      }
    },
  }

  const runTool: AiTool<Input, unknown> = {
    ...common,
    name: 'query_run',
    description:
      'Runs a proposed query and returns its columns and rows: at most 200 groups (aggregate) or 50 rows (raw), ' +
      'or its limit, plus the number of rows ("total"). An aggregate result has "totals": its measures over all ' +
      'the rows, without grouping. Take overall figures from "totals", never by adding rows, and cite the query id.',
    /**
     * Runs a proposed query, capped.
     * @param {Input} input - Tool input.
     * @param {object} ctx - Tool context.
     * @returns {Promise<object>} The result, or an error result.
     */
    execute: async ({ queryId }, ctx) => {
      const entry = ctx.analysisQueries?.get(queryId)
      if (!entry) throw unknownQuery(queryId)
      const aggregate = entry.mode === 'aggregate'
      const max = Math.min(entry.limit ?? Infinity, aggregate ? aggregateRowsMax : rawRowsMax)
      const requestParams = getRequestParams(ctx, entry)
      try {
        const { rows, total, truncated } = await fetchCappedRows({ api, requestParams, max })
        const columns = getQueryResultColumns({ survey: ctx.survey, query: entry.query })
        const resultRows = toResultRows({ rows, columns })
        // one group is its own total
        const totals = aggregate && total > 1 ? await fetchTotals({ api, requestParams, columns }) : null
        const head = { queryId, mode: entry.mode, columns: columns.map((column) => column.name) }
        const body = {
          ...(totals ? { totals } : {}),
          rows: aggregate ? markEmptyGroups({ rows: resultRows, columns }) : resultRows,
          total,
          truncated,
        }
        // the room of the truncation note is kept
        const fitted = fitListToBudget({ ...head, ...body }, 'rows', getResultBudget(ctx) - NOTE_RESERVE_CHARS)
        if (!fitted.truncated) return fitted
        const sorted = Query.getSort(entry.query).length > 0
        const note = getTruncationNote({ shown: fitted.rows.length, total, sorted, hasTotals: !!totals })
        // the note goes before the rows: a model reads it first
        return { ...head, note, ...body, rows: fitted.rows, truncated: true }
      } catch (error) {
        throw toQueryFailure(error)
      }
    },
  }

  return [countTool, runTool]
}
