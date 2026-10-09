import axios from 'axios'

export type ValidationReportFilter = {
  surveyId: number
  cycle: string
  recordUuid?: string | null
  attributeDefUuids?: string[] | null
  messageTypeKeys?: string[] | null
}

export type CleaningApi = {
  fetchValidationReportRows: (params: ValidationReportFilter & { offset: number; limit: number }) => Promise<any[]>
  countValidationReportRows: (params: ValidationReportFilter) => Promise<number>
  // null when the user may not see the record (403, group qualifiers) or it doesn't exist (404)
  fetchRecordAndNodes: (params: { surveyId: number; recordUuid: string }) => Promise<any | null>
  searchRecordsSummary: (params: { surveyId: number; cycle: string; search: string }) => Promise<any[]>
  fetchCategoryItems: (params: {
    surveyId: number
    categoryUuid: string
    parentUuid: string | null
    search: string
  }) => Promise<any[]>
  findTaxa: (params: {
    surveyId: number
    taxonomyUuid: string
    filterProp: 'code' | 'scientificName'
    filterValue: string
  }) => Promise<any[]>
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

export const axiosCleaningApi: CleaningApi = {
  /**
   * Fetches a page of validation report rows.
   * @param {object} params - Request parameters.
   * @returns {Promise<any>} The rows.
   */
  fetchValidationReportRows: async ({ surveyId, offset, limit, ...filter }) => {
    const { data } = await axios.get(`/api/survey/${surveyId}/validationReport`, {
      params: { ...toReportParams({ surveyId, ...filter }), offset, limit },
    })
    return data.list
  },
  /**
   * Counts the validation report rows.
   * @param {object} params - Request parameters.
   * @returns {Promise<any>} The count.
   */
  countValidationReportRows: async ({ surveyId, ...filter }) => {
    const { data } = await axios.get(`/api/survey/${surveyId}/validationReport/count`, {
      params: toReportParams({ surveyId, ...filter }),
    })
    return Number(data.count)
  },
  /**
   * Fetches a record with its nodes, or null when it is not available to the user.
   * @param {object} params - Request parameters.
   * @returns {Promise<any>} The record or null.
   */
  fetchRecordAndNodes: async ({ surveyId, recordUuid }) => {
    try {
      const { data } = await axios.get(`/api/survey/${surveyId}/record`, { params: { recordUuid } })
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
  searchRecordsSummary: async ({ surveyId, cycle, search }) => {
    const { data } = await axios.get(`/api/survey/${surveyId}/records/summary`, {
      params: { cycle, search, limit: 20, offset: 0 },
    })
    return data.list
  },
  /**
   * Fetches published category items.
   * @param {object} params - Request parameters.
   * @returns {Promise<any>} The items.
   */
  fetchCategoryItems: async ({ surveyId, categoryUuid, parentUuid, search }) => {
    const { data } = await axios.get(`/api/survey/${surveyId}/categories/${categoryUuid}/items`, {
      params: { draft: false, parentUuid, search },
    })
    return Object.values(data.items ?? {})
  },
  /**
   * Finds published taxa by code or scientific name.
   * @param {object} params - Request parameters.
   * @returns {Promise<any>} The taxa.
   */
  findTaxa: async ({ surveyId, taxonomyUuid, filterProp, filterValue }) => {
    const { data } = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/taxa`, {
      params: { draft: false, filterProp, filterValue, limit: 20 },
    })
    return data.list
  },
}
