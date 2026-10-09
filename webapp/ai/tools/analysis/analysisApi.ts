/**
 * HTTP calls of the analysis tools: the Explorer and dashboard endpoints, with the user's session,
 * so the assistant sees exactly what the user sees in the Explorer (same permissions and owner filtering).
 */
import axios from 'axios'

import SystemError from '@core/systemError'
import { Query } from '@common/model/query'

import { getEntityViewDataCountRequest } from '@webapp/service/api/surveyRdb'

export const analysisRequestTimeoutMs = 60_000

type HttpOptions = { params?: Record<string, unknown>; signal?: AbortSignal; timeout: number }

export type AnalysisHttp = {
  get: (url: string, options: HttpOptions) => Promise<unknown>
  post: (url: string, body: object, options: HttpOptions) => Promise<unknown>
}

type SurveyParams = { surveyId: number; cycle: string; signal?: AbortSignal }
type QueryParams = SurveyParams & { query: object }

export type AnalysisApi = {
  fetchQueryRows: (params: QueryParams & { limit: number; offset?: number }) => Promise<Record<string, unknown>[]>
  fetchQueryCount: (params: QueryParams) => Promise<number>
  fetchRecordsCountByStep: (params: SurveyParams) => Promise<Record<string, number | string>>
  fetchRecordsCountByDay: (
    params: SurveyParams & { from: string; to: string }
  ) => Promise<{ date: string; count: number | string }[]>
  fetchCategoryItems: (params: {
    surveyId: number
    categoryUuid: string
    search: string
    lang: string
    draft: boolean
    signal?: AbortSignal
  }) => Promise<object[]>
}

/**
 * Axios implementation of the analysis HTTP calls.
 */
export const axiosAnalysisHttp: AnalysisHttp = {
  get: async (url, options) => (await axios.get(url, options)).data,
  post: async (url, body, options) => (await axios.post(url, body, options)).data,
}

/**
 * Returns true when the error is a request timeout (client or proxy).
 * @param {any} error - The error.
 * @returns {boolean} Whether the request timed out.
 */
export const isTimeoutError = (error: any): boolean =>
  error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT' || error?.response?.status === 504

/**
 * Runs a request, turning a timeout into the queryTimeout error.
 * @param {Function} request - The request.
 * @returns {Promise<any>} The request result.
 */
export const withTimeoutError = async <T>(request: () => Promise<T>): Promise<T> => {
  try {
    return await request()
  } catch (error) {
    if (isTimeoutError(error)) throw new SystemError('queryTimeout')
    throw error
  }
}

/**
 * Checks the row limit: the server has none, so every query request must carry one.
 * @param {unknown} limit - The limit.
 * @returns {void}
 */
const assertLimit = (limit: unknown): void => {
  if (!Number.isInteger(limit) || (limit as number) <= 0) throw new Error(`invalid query limit: ${String(limit)}`)
}

/**
 * Creates the analysis API client.
 * @param {object} params - Parameters.
 * @param {AnalysisHttp} params.http - HTTP implementation (axios in the app, a fake in tests).
 * @returns {AnalysisApi} The client.
 */
export const createAnalysisApi = ({ http }: { http: AnalysisHttp }): AnalysisApi => ({
  fetchQueryRows: async ({ surveyId, cycle, query, limit, offset = 0, signal }) => {
    assertLimit(limit)
    const url = `/api/surveyRdb/${surveyId}/${Query.getEntityDefUuid(query)}/query`
    const body = { cycle, query, limit, offset }
    return withTimeoutError(
      async () =>
        (await http.post(url, body, { signal, timeout: analysisRequestTimeoutMs })) as Record<string, unknown>[]
    )
  },
  fetchQueryCount: async ({ surveyId, cycle, query, signal }) => {
    const { url, body } = getEntityViewDataCountRequest({ surveyId, query, cycle })
    const count = await withTimeoutError(async () =>
      Number(await http.post(url, body, { signal, timeout: analysisRequestTimeoutMs }))
    )
    if (!Number.isFinite(count)) throw new Error('invalid query count response')
    return count
  },
  fetchRecordsCountByStep: async ({ surveyId, cycle, signal }) =>
    withTimeoutError(
      async () =>
        (await http.get(`/api/survey/${surveyId}/records/count/by-step`, {
          params: { cycle },
          signal,
          timeout: analysisRequestTimeoutMs,
        })) as Record<string, number | string>
    ),
  fetchRecordsCountByDay: async ({ surveyId, cycle, from, to, signal }) =>
    withTimeoutError(
      async () =>
        (await http.get(`/api/survey/${surveyId}/records/dashboard/count`, {
          // countType=user would expose owner names: never used
          params: { cycle, from, to, countType: 'default' },
          signal,
          timeout: analysisRequestTimeoutMs,
        })) as { date: string; count: number | string }[]
    ),
  fetchCategoryItems: async ({ surveyId, categoryUuid, search, lang, draft, signal }) => {
    const data = await withTimeoutError(
      async () =>
        (await http.get(`/api/survey/${surveyId}/categories/${categoryUuid}/items`, {
          // no parentUuid: first level items
          params: { draft, search, lang },
          signal,
          timeout: analysisRequestTimeoutMs,
        })) as { items?: Record<string, object> } | null
    )
    return Object.values(data?.items ?? {})
  },
})
