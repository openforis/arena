import { z } from 'zod'

import type { AiTool } from '@webapp/ai/tools/types'

import type { AnalysisApi } from './analysisApi'
import { getQueryResultColumns, toResultRows } from './queryResult'
import { canViewCurrentSurvey, fitListToBudget, getAnalysisContext, toolError } from './toolResults'

export const aggregateRowsMax = 200
export const rawRowsMax = 50

const inputSchema = z.object({
  queryId: z.string().max(20).describe('Id returned by query_propose (q1, q2, …)'),
})

type Input = z.infer<typeof inputSchema>

/**
 * Returns the error for a query id that was not proposed in this conversation.
 * @param {string} queryId - The id.
 * @returns {object} The error result.
 */
const unknownQuery = (queryId: string) =>
  toolError('unknownQuery', `Unknown query "${queryId}": propose it with query_propose and use the returned queryId`)

/**
 * Turns a timeout into a result the model can act on; other errors are re-thrown.
 * @param {any} error - The error.
 * @returns {object} The error result.
 */
const handleQueryError = (error: any) => {
  if (error?.key === 'queryTimeout') {
    return toolError(
      'queryTimeout',
      'The query took too long. Aggregate the data or add a filter, then propose a new query.'
    )
  }
  throw error
}

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
 * Creates query_count and query_run.
 * @param {object} params - Parameters.
 * @param {AnalysisApi} params.api - Analysis API.
 * @returns {AiTool[]} The two tools.
 */
export const createRunQueryTools = ({ api }: { api: AnalysisApi }): AiTool<Input, unknown>[] => {
  const common: Pick<AiTool<Input>, 'inputSchema' | 'area' | 'dataClass' | 'effect' | 'requires'> = {
    inputSchema,
    area: ['analysis'],
    dataClass: 'data',
    effect: 'read',
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
      if (!entry) return unknownQuery(queryId)
      try {
        const total = await api.fetchQueryCount(getRequestParams(ctx, entry))
        return { queryId, mode: entry.mode, total }
      } catch (error) {
        return handleQueryError(error)
      }
    },
  }

  const runTool: AiTool<Input, unknown> = {
    ...common,
    name: 'query_run',
    description:
      'Runs a proposed query and returns its columns and rows: at most 200 groups (aggregate) or 50 rows plus ' +
      'the total (raw). Compute numbers with aggregate queries and cite the query id.',
    /**
     * Runs a proposed query, capped.
     * @param {Input} input - Tool input.
     * @param {object} ctx - Tool context.
     * @returns {Promise<object>} The result, or an error result.
     */
    execute: async ({ queryId }, ctx) => {
      const entry = ctx.analysisQueries?.get(queryId)
      if (!entry) return unknownQuery(queryId)
      const max = entry.mode === 'aggregate' ? aggregateRowsMax : rawRowsMax
      try {
        const { rows, total, truncated } = await fetchCappedRows({
          api,
          requestParams: getRequestParams(ctx, entry),
          max,
        })
        const columns = getQueryResultColumns({ survey: ctx.survey, query: entry.query })
        const result = {
          queryId,
          mode: entry.mode,
          columns: columns.map((column) => column.name),
          rows: toResultRows({ rows, columns }),
          total,
          truncated,
        }
        return fitListToBudget(result, 'rows')
      } catch (error) {
        return handleQueryError(error)
      }
    },
  }

  return [countTool, runTool]
}
