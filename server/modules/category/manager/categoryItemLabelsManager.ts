/**
 * Category item labels for the assistant (suggestion 6): missing-label counts and pages, and the atomic labels
 * update. Every request error is a 400 `appErrors:categoryItemLabelsInvalid` with the reason.
 */
import * as Survey from '@core/survey/survey'
import SystemError, { StatusCodes } from '@core/systemError'
import { isUuid } from '@core/uuid'

import {
  MISSING_LABELS_SERVER_PAGE_DEFAULT,
  MISSING_LABELS_SERVER_PAGE_MAX,
  type MissingLabelsCounts,
  type MissingLabelsPage,
} from '@common/ai/categoryItemLabels'
import { db } from '@server/db/db'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as CategoryItemLabelsRepository from '@server/modules/category/repository/categoryItemLabelsRepository'

/**
 * Creates the error of an invalid request.
 * @param {string} reason - What is wrong: category, lang, cursor, limit, items, item, text, expectedText, duplicate.
 * @returns {SystemError} The error (status 400).
 */
export const categoryItemLabelsInvalid = (reason: string): SystemError =>
  new SystemError('appErrors:categoryItemLabelsInvalid', { reason }, StatusCodes.BAD_REQUEST)

/**
 * Throws the invalid request error when a check fails.
 * @param {boolean} valid - Check result.
 * @param {string} reason - Reason reported when it fails.
 * @returns {void}
 */
export const requireValid = (valid: boolean, reason: string): void => {
  if (!valid) throw categoryItemLabelsInvalid(reason)
}

/**
 * Returns the languages of the draft survey info.
 * @param {number|string} surveyId - Survey id.
 * @param {object} client - Database client.
 * @returns {Promise<string[]>} The languages, default first.
 */
export const fetchSurveyLanguages = async (surveyId: number | string, client: any): Promise<string[]> => {
  const surveyInfo = await SurveyRepository.fetchSurveyById({ surveyId, draft: true }, client)
  return Survey.getLanguages(surveyInfo) as string[]
}

/**
 * Parses the cursor parameter.
 * @param {unknown} cursor - Raw value.
 * @returns {string|null} The item uuid, null for the first page.
 */
const parseCursor = (cursor: unknown): string | null => {
  if (cursor === undefined || cursor === null || cursor === '') return null
  requireValid(typeof cursor === 'string' && isUuid(cursor), 'cursor')
  return cursor as string
}

/**
 * Parses the limit parameter.
 * @param {unknown} limit - Raw value (a query string value or a number).
 * @returns {number} The limit.
 */
const parseLimit = (limit: unknown): number => {
  if (limit === undefined || limit === null || limit === '') return MISSING_LABELS_SERVER_PAGE_DEFAULT
  const value = Number(limit)
  requireValid(Number.isInteger(value) && value >= 1 && value <= MISSING_LABELS_SERVER_PAGE_MAX, 'limit')
  return value
}

/**
 * Counts the items missing a label, per category and language (nothing with fewer than two languages).
 * @param {object} params - Parameters.
 * @param {number|string} params.surveyId - Survey id.
 * @param {object} [client] - Database client.
 * @returns {Promise<MissingLabelsCounts>} Counts by category uuid, then language.
 */
export const countItemsMissingLabels = async (
  { surveyId }: { surveyId: number | string },
  client: any = db
): Promise<MissingLabelsCounts> => {
  const langs = await fetchSurveyLanguages(surveyId, client)
  if (langs.length < 2) return {}
  return CategoryItemLabelsRepository.countItemsMissingLabels({ surveyId, langs }, client)
}

/**
 * Fetches one page of the items of a category whose label is missing in a language.
 * @param {object} params - Parameters (raw request values).
 * @param {number|string} params.surveyId - Survey id.
 * @param {string} params.categoryUuid - Category uuid.
 * @param {string} params.lang - Missing language (a survey language).
 * @param {string} [params.cursor] - nextCursor of the previous page.
 * @param {number|string} [params.limit] - Page size (1–200, default 50).
 * @param {object} [client] - Database client.
 * @returns {Promise<MissingLabelsPage>} The page.
 */
export const fetchItemsMissingLabels = async (
  {
    surveyId,
    categoryUuid,
    lang,
    cursor,
    limit,
  }: { surveyId: number | string; categoryUuid: unknown; lang: unknown; cursor?: unknown; limit?: unknown },
  client: any = db
): Promise<MissingLabelsPage> => {
  requireValid(typeof categoryUuid === 'string' && isUuid(categoryUuid), 'category')
  const after = parseCursor(cursor)
  const size = parseLimit(limit)
  const langs = await fetchSurveyLanguages(surveyId, client)
  requireValid(typeof lang === 'string' && langs.includes(lang), 'lang')
  const uuid = categoryUuid as string
  requireValid(await CategoryItemLabelsRepository.categoryExists({ surveyId, categoryUuid: uuid }, client), 'category')
  // one more item tells whether a next page exists
  const { total, items } = await CategoryItemLabelsRepository.fetchItemsMissingLabels(
    { surveyId, categoryUuid: uuid, lang: lang as string, langs, cursor: after, limit: size + 1 },
    client
  )
  const pageItems = items.slice(0, size)
  const nextCursor = items.length > size ? pageItems[pageItems.length - 1].uuid : null
  return { total, items: pageItems, nextCursor }
}
