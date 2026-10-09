import axios from 'axios'

import { analysisRequestTimeoutMs, withTimeoutError } from '@webapp/ai/tools/analysis/analysisApi'

export type ValidationReportFilter = {
  surveyId: number
  cycle: string
  recordUuid?: string | null
  attributeDefUuids?: string[] | null
  messageTypeKeys?: string[] | null
}

type WithSignal = { signal?: AbortSignal }

export type CleaningApi = {
  fetchValidationReportRows: (
    params: ValidationReportFilter & WithSignal & { offset: number; limit: number }
  ) => Promise<any[]>
  countValidationReportRows: (params: ValidationReportFilter & WithSignal) => Promise<number>
  // null when the user may not see the record (403, group qualifiers) or it doesn't exist (404)
  fetchRecordAndNodes: (params: { surveyId: number; recordUuid: string } & WithSignal) => Promise<any | null>
  searchRecordsSummary: (
    params: { surveyId: number; cycle: string; search: string; limit?: number; offset?: number } & WithSignal
  ) => Promise<any[]>
  fetchCategoryItems: (
    params: {
      surveyId: number
      categoryUuid: string
      parentUuid: string | null
      search: string
    } & WithSignal
  ) => Promise<any[]>
  findTaxa: (
    params: {
      surveyId: number
      taxonomyUuid: string
      filterProp: 'code' | 'scientificName'
      filterValue: string
    } & WithSignal
  ) => Promise<any[]>
}

/**
 * Converts the report filter into the query parameters of the validation report endpoints.
 * @param {ValidationReportFilter} filter - The filter.
 * @returns {object} The query parameters.
 */
const toReportParams = ({ cycle, recordUuid, attributeDefUuids, messageTypeKeys }: ValidationReportFilter) => ({
  cycle,
  ...(recordUuid ? { recordUuid } : {}),
  ...(attributeDefUuids?.length ? { attributeDefUuids: JSON.stringify(attributeDefUuids) } : {}),
  ...(messageTypeKeys?.length ? { messageTypeKeys: JSON.stringify(messageTypeKeys) } : {}),
})

/**
 * Returns true for the HTTP statuses that mean "the record is not available to this user".
 * @param {unknown} error - The axios error.
 * @returns {boolean} Whether the record is not available.
 */
const isRecordUnavailableError = (error: any): boolean => [403, 404].includes(error?.response?.status)

/**
 * GETs with the request timeout, turning a timeout into the queryTimeout error.
 * @param {string} url - Request URL.
 * @param {object} config - Axios config (params, signal).
 * @returns {Promise<any>} The axios response.
 */
const getWithTimeout = (url: string, config: { params: object; signal?: AbortSignal }): Promise<{ data: any }> =>
  withTimeoutError(() => axios.get(url, { ...config, timeout: analysisRequestTimeoutMs }))

export const axiosCleaningApi: CleaningApi = {
  /**
   * Fetches a page of validation report rows.
   * @param {object} params - Request parameters.
   * @returns {Promise<any>} The rows.
   */
  fetchValidationReportRows: async ({ surveyId, offset, limit, signal, ...filter }) => {
    const { data } = await getWithTimeout(`/api/survey/${surveyId}/validationReport`, {
      params: { ...toReportParams({ surveyId, ...filter }), offset, limit },
      signal,
    })
    return data.list
  },
  /**
   * Counts the validation report rows.
   * @param {object} params - Request parameters.
   * @returns {Promise<any>} The count.
   */
  countValidationReportRows: async ({ surveyId, signal, ...filter }) => {
    const { data } = await getWithTimeout(`/api/survey/${surveyId}/validationReport/count`, {
      params: toReportParams({ surveyId, ...filter }),
      signal,
    })
    return Number(data.count)
  },
  /**
   * Fetches a record with its nodes, or null when it is not available to the user.
   * @param {object} params - Request parameters.
   * @returns {Promise<any>} The record or null.
   */
  fetchRecordAndNodes: async ({ surveyId, recordUuid, signal }) => {
    try {
      const { data } = await getWithTimeout(`/api/survey/${surveyId}/record`, { params: { recordUuid }, signal })
      return data
    } catch (error) {
      if (isRecordUnavailableError(error)) return null
      throw error
    }
  },
  /**
   * Searches record summaries by key.
   * @param {object} params - Request parameters.
   * @returns {Promise<any>} The summaries.
   */
  searchRecordsSummary: async ({ surveyId, cycle, search, limit = 20, offset = 0, signal }) => {
    const { data } = await getWithTimeout(`/api/survey/${surveyId}/records/summary`, {
      params: { cycle, search, limit, offset },
      signal,
    })
    return data.list
  },
  /**
   * Fetches published category items.
   * @param {object} params - Request parameters.
   * @returns {Promise<any>} The items.
   */
  fetchCategoryItems: async ({ surveyId, categoryUuid, parentUuid, search, signal }) => {
    const { data } = await getWithTimeout(`/api/survey/${surveyId}/categories/${categoryUuid}/items`, {
      params: { draft: false, parentUuid, search, limit: 100 },
      signal,
    })
    return Object.values(data.items ?? {})
  },
  /**
   * Finds published taxa by code or scientific name.
   * @param {object} params - Request parameters.
   * @returns {Promise<any>} The taxa.
   */
  findTaxa: async ({ surveyId, taxonomyUuid, filterProp, filterValue, signal }) => {
    const { data } = await getWithTimeout(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa`, {
      params: { draft: false, filterProp, filterValue, limit: 20 },
      signal,
    })
    return data.list
  },
}
