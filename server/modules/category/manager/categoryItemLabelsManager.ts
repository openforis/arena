/**
 * Category item labels for the assistant (suggestion 6): missing-label counts and pages, and the atomic labels
 * update. Every request error is a 400 `appErrors:categoryItemLabelsInvalid` with the reason.
 */
import * as CategoryItem from '@core/survey/categoryItem'
import * as Survey from '@core/survey/survey'
import SystemError, { StatusCodes } from '@core/systemError'
import { isUuid } from '@core/uuid'

import * as ActivityLog from '@common/activityLog/activityLog'
import {
  CATEGORY_ITEM_LABEL_TEXT_MAX,
  CATEGORY_ITEM_LABELS_UPDATE_MAX,
  MISSING_LABELS_SERVER_PAGE_DEFAULT,
  MISSING_LABELS_SERVER_PAGE_MAX,
  type CategoryItemLabelConflict,
  type CategoryItemLabelsUpdateAnswer,
  type CategoryItemLabelUpdate,
  type MissingLabelsCounts,
  type MissingLabelsPage,
} from '@common/ai/categoryItemLabels'
import { db } from '@server/db/db'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as CategoryItemLabelsRepository from '@server/modules/category/repository/categoryItemLabelsRepository'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as CategoryRepository from '@server/modules/category/repository/categoryRepository'
import { markSurveyDraft } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

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

/**
 * Parses one update of the request.
 * @param {unknown} raw - Raw update.
 * @param {string[]} langs - Survey languages.
 * @returns {CategoryItemLabelUpdate} The update.
 */
const parseUpdate = (raw: unknown, langs: string[]): CategoryItemLabelUpdate => {
  requireValid(typeof raw === 'object' && raw !== null && !Array.isArray(raw), 'item')
  const { itemUuid, lang, text, expectedText } = raw as Record<string, unknown>
  requireValid(typeof itemUuid === 'string' && isUuid(itemUuid), 'item')
  requireValid(typeof lang === 'string' && langs.includes(lang), 'lang')
  requireValid(
    typeof text === 'string' && text.trim().length > 0 && text.length <= CATEGORY_ITEM_LABEL_TEXT_MAX,
    'text'
  )
  requireValid(expectedText === undefined || expectedText === null || typeof expectedText === 'string', 'expectedText')
  return {
    itemUuid: itemUuid as string,
    lang: lang as string,
    text: text as string,
    expectedText: (expectedText as string | null | undefined) ?? null,
  }
}

/**
 * Parses the items of the request.
 * @param {unknown} items - Raw items.
 * @param {string[]} langs - Survey languages.
 * @returns {CategoryItemLabelUpdate[]} The updates, in request order.
 */
const parseUpdates = (items: unknown, langs: string[]): CategoryItemLabelUpdate[] => {
  requireValid(Array.isArray(items) && items.length > 0 && items.length <= CATEGORY_ITEM_LABELS_UPDATE_MAX, 'items')
  const seen = new Set<string>()
  const updates: CategoryItemLabelUpdate[] = []
  for (const raw of items as unknown[]) {
    const update = parseUpdate(raw, langs)
    const key = `${update.itemUuid}|${update.lang}`
    requireValid(!seen.has(key), 'duplicate')
    seen.add(key)
    updates.push(update)
  }
  return updates
}

/**
 * Returns a label as compared with the expected text: a blank label is null.
 * @param {string|null|undefined} text - Label.
 * @returns {string|null} The label, null when blank.
 */
const normalizeLabel = (text: string | null | undefined): string | null =>
  typeof text === 'string' && text.trim().length > 0 ? text : null

/**
 * Returns the conflict of an update, if any.
 * @param {CategoryItemLabelUpdate} update - Update.
 * @param {ItemLabelsRow|undefined} row - Locked row of the item (undefined: deleted).
 * @returns {CategoryItemLabelConflict|null} The conflict, null when the label can be written.
 */
const getConflict = (
  update: CategoryItemLabelUpdate,
  row: CategoryItemLabelsRepository.ItemLabelsRow | undefined
): CategoryItemLabelConflict | null => {
  const { itemUuid, lang, expectedText } = update
  if (!row) return { itemUuid, lang, reason: 'itemMissing', currentText: null }
  const currentText = normalizeLabel(row.labels[lang])
  if (currentText === normalizeLabel(expectedText)) return null
  return { itemUuid, lang, reason: 'valueChanged', currentText }
}

/**
 * Creates the activity of a label write (the same content as the category editor's item prop update).
 * @param {ItemLabelsRow} row - Item row.
 * @param {object} labels - Labels after the write.
 * @returns {object} The activity.
 */
const newLabelsActivity = (row: CategoryItemLabelsRepository.ItemLabelsRow, labels: Record<string, string>) =>
  ActivityLog.newActivity(
    ActivityLog.type.categoryItemPropUpdate,
    {
      [ActivityLog.keysContent.uuid]: row.uuid,
      [ActivityLog.keysContent.code]: row.code,
      [ActivityLog.keysContent.categoryUuid]: row.categoryUuid,
      [ActivityLog.keysContent.levelUuid]: row.levelUuid,
      [ActivityLog.keysContent.key]: CategoryItem.keysProps.labels,
      [ActivityLog.keysContent.value]: labels,
    },
    false
  )

/**
 * Writes the updates that do not conflict, in request order.
 * @param {object} params - Parameters.
 * @param {number|string} params.surveyId - Survey id.
 * @param {CategoryItemLabelUpdate[]} params.updates - Updates.
 * @param {object} tx - Transaction.
 * @returns {Promise<object>} The answer without categories, the activities and the touched category uuids.
 */
const writeUpdates = async (
  { surveyId, updates }: { surveyId: number | string; updates: CategoryItemLabelUpdate[] },
  tx: any
) => {
  const itemUuids = [...new Set(updates.map((update) => update.itemUuid))]
  const rows = await CategoryItemLabelsRepository.fetchItemsLabelsByUuids({ surveyId, itemUuids }, tx)
  const rowsByUuid = new Map(rows.map((row) => [row.uuid, row]))
  const applied: CategoryItemLabelsUpdateAnswer['applied'] = []
  const conflicts: CategoryItemLabelConflict[] = []
  const activities: any[] = []
  const categoryUuids = new Set<string>()
  for (const update of updates) {
    const row = rowsByUuid.get(update.itemUuid)
    const conflict = getConflict(update, row)
    if (conflict || !row) {
      if (conflict) conflicts.push(conflict)
      continue
    }
    const { itemUuid, lang, text } = update
    const labels = await CategoryItemLabelsRepository.updateItemLabel({ surveyId, itemUuid, lang, text }, tx)
    // a second language of the same item compares with the labels after this write
    rowsByUuid.set(itemUuid, { ...row, labels })
    applied.push({ itemUuid, lang })
    activities.push(newLabelsActivity(row, labels))
    categoryUuids.add(row.categoryUuid)
  }
  return { applied, conflicts, activities, categoryUuids }
}

/**
 * Writes category item labels in one language each, if they are still what the proposal saw (compare and set).
 * @param {object} params - Parameters.
 * @param {object} params.user - User.
 * @param {number|string} params.surveyId - Survey id.
 * @param {unknown} params.items - Raw request items (CategoryItemLabelUpdate[]).
 * @param {object} [client] - Database client.
 * @returns {Promise<CategoryItemLabelsUpdateAnswer>} Written labels, conflicts and the touched categories.
 */
export const updateItemsLabels = async (
  { user, surveyId, items }: { user: any; surveyId: number | string; items: unknown },
  client: any = db
): Promise<CategoryItemLabelsUpdateAnswer> =>
  client.tx(async (tx: any) => {
    const langs = await fetchSurveyLanguages(surveyId, tx)
    const updates = parseUpdates(items, langs)
    const { applied, conflicts, activities, categoryUuids } = await writeUpdates({ surveyId, updates }, tx)
    if (activities.length > 0) {
      await markSurveyDraft(surveyId, tx)
      await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
    }
    const categories: any[] = []
    for (const categoryUuid of categoryUuids) {
      categories.push(
        await CategoryRepository.fetchCategoryAndLevelsByUuid(
          { surveyId, categoryUuid, draft: true, includeValidation: true },
          tx
        )
      )
    }
    return { applied, conflicts, categories }
  })
