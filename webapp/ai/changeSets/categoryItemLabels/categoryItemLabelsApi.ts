/**
 * Browser calls of the category item labels endpoints (all need survey edit permission).
 */
import axios from 'axios'

import type {
  CategoryItemLabelsUpdateAnswer,
  CategoryItemLabelUpdate,
  MissingLabelsCounts,
  MissingLabelsPage,
} from '@common/ai/categoryItemLabels'

export type FetchMissingLabelsCounts = (params: {
  surveyId: number
  signal?: AbortSignal
}) => Promise<MissingLabelsCounts>

export type FetchMissingLabelsPage = (params: {
  surveyId: number
  categoryUuid: string
  lang: string
  cursor: string | null
  limit: number
  signal?: AbortSignal
}) => Promise<MissingLabelsPage>

export type PutCategoryItemLabels = (params: {
  surveyId: number
  items: CategoryItemLabelUpdate[]
}) => Promise<CategoryItemLabelsUpdateAnswer>

/**
 * Fetches the number of items missing a label, per category and survey language.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Survey id.
 * @param {AbortSignal} [params.signal] - Aborts the request.
 * @returns {Promise<MissingLabelsCounts>} The counts.
 */
export const fetchMissingLabelsCounts: FetchMissingLabelsCounts = async ({ surveyId, signal }) => {
  const { data } = await axios.get(`/api/survey/${surveyId}/categories/items/missing-labels`, { signal })
  return data
}

/**
 * Fetches a page of the items of a category whose label is missing in a language.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Survey id.
 * @param {string} params.categoryUuid - Category uuid.
 * @param {string} params.lang - Language.
 * @param {string|null} params.cursor - nextCursor of the previous page (null: first page).
 * @param {number} params.limit - Page size (at most 200).
 * @param {AbortSignal} [params.signal] - Aborts the request.
 * @returns {Promise<MissingLabelsPage>} The page.
 */
export const fetchMissingLabelsPage: FetchMissingLabelsPage = async ({
  surveyId,
  categoryUuid,
  lang,
  cursor,
  limit,
  signal,
}) => {
  const { data } = await axios.get(`/api/survey/${surveyId}/categories/${categoryUuid}/items/missing-labels`, {
    params: { lang, limit, ...(cursor ? { cursor } : {}) },
    signal,
  })
  return data
}

/**
 * Writes category item labels (one transaction; conflicts are reported, not written).
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Survey id.
 * @param {CategoryItemLabelUpdate[]} params.items - Labels to write.
 * @returns {Promise<CategoryItemLabelsUpdateAnswer>} The answer.
 */
export const putCategoryItemLabels: PutCategoryItemLabels = async ({ surveyId, items }) => {
  const { data } = await axios.put(`/api/survey/${surveyId}/categories/items/labels`, { items })
  return data
}
