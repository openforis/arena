/**
 * Lists the items of a category whose label is missing in a survey language, page by page (suggestion 6). The
 * items come from the server: the browser does not hold the items of large categories.
 */
import { z } from 'zod'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import { AiLimits } from '@common/ai/limits'
import { CATEGORY_ITEM_LABEL_TEXT_MAX, type MissingLabelsItem } from '@common/ai/categoryItemLabels'

import {
  fetchMissingLabelsPage,
  type FetchMissingLabelsPage,
} from '@webapp/ai/changeSets/categoryItemLabels/categoryItemLabelsApi'
import { isCategoryItemLabelOperation } from '@webapp/ai/changeSets/categoryItemLabels/types'

import { AiToolFailure } from '../toolFailure'
import type { AiTool, AiToolContext } from '../types'
import { createCategoryItemRefs, type CategoryItemRefs } from './categoryItemRefs'
import { canEditSurveyTool, requireSurvey } from './surveyLookup'

export const LIST_MISSING_LABELS_SERVER_PAGE = 100
export const LIST_MISSING_LABELS_MAX_REQUESTS = 5
export const LIST_MISSING_LABELS_DEFAULT_LIMIT = 50
const RESULT_MAX_JSON_CHARS = AiLimits.assistantToolResultMaxChars - 500

export type ListMissingLabelsInput = { categoryName: string; lang: string; cursor?: string; limit?: number }

export type ListedCategoryItem = {
  // code path, e.g. "2.14": what the model passes back to categoryItemLabels_proposeSet
  ref: string
  levelName: string
  code: string
  sourceLang: string | null
  sourceText: string
  sourceTextTruncated?: true
}

export type ListMissingLabelsResult = {
  categoryName: string
  lang: string
  total: number
  items: ListedCategoryItem[]
  nextCursor: string | null
  note: string
}

type PageState = { items: ListedCategoryItem[]; size: number; lastConsumed: string | null; full: boolean }

type PageParams = {
  refs: CategoryItemRefs
  surveyId: number
  categoryUuid: string
  lang: string
  languages: string[]
  pendingItemUuids: Set<string>
  limit: number
}

/**
 * Returns the category with a name, or fails for the model.
 * @param {object} survey - Survey.
 * @param {string} categoryName - Category name.
 * @returns {object} The category.
 */
export const requireCategory = (survey: any, categoryName: string): any => {
  const category = Survey.getCategoryByName(categoryName)(survey)
  if (!category) {
    throw new AiToolFailure('categoryNotFound', `No category is named "${categoryName}".`, { categoryName })
  }
  return category
}

/**
 * Fails when a conversation started by Do it on this suggestion asks for another category.
 * @param {AiToolContext} ctx - Tool context.
 * @param {string} categoryUuid - Category uuid.
 * @param {string} categoryName - Category name.
 * @returns {void}
 */
export const checkScope = (ctx: AiToolContext, categoryUuid: string, categoryName: string): void => {
  const scope = ctx.suggestionScope
  if (scope?.kind !== 'categoryItemTranslations' || scope.targetKeys.includes(categoryUuid)) return
  throw new AiToolFailure(
    'categoryOutOfScope',
    `The user accepted the translation of other categories; "${categoryName}" is not one of them.`,
    { categoryName }
  )
}

/**
 * Returns the survey languages, failing when lang is not one of them.
 * @param {object} survey - Survey.
 * @param {string} lang - Requested language.
 * @returns {string[]} The survey languages, default first.
 */
const requireSurveyLanguage = (survey: any, lang: string): string[] => {
  const languages = Survey.getLanguages(Survey.getSurveyInfo(survey)) as unknown as string[]
  if (!languages.includes(lang)) {
    throw new AiToolFailure('invalidInput', `"${lang}" is not a survey language (${languages.join(', ')}).`)
  }
  return languages
}

/**
 * Returns the items whose label in lang is in a pending card (not applied nor discarded yet).
 * @param {AiToolContext} ctx - Tool context.
 * @param {string} categoryUuid - Category uuid.
 * @param {string} lang - Language.
 * @returns {Set<string>} The item uuids.
 */
const getPendingItemUuids = (ctx: AiToolContext, categoryUuid: string, lang: string): Set<string> => {
  const result = new Set<string>()
  for (const changeSet of ctx.getPendingChangeSets?.() ?? []) {
    for (const op of changeSet.operations) {
      if (isCategoryItemLabelOperation(op) && op.categoryUuid === categoryUuid && op.lang === lang) {
        result.add(op.itemUuid)
      }
    }
  }
  return result
}

/**
 * Converts a server item to what the model reads; the source is the first filled label, default language first.
 * @param {MissingLabelsItem} item - Server item.
 * @param {string} lang - Language to translate to.
 * @param {string[]} languages - Survey languages, default first.
 * @returns {ListedCategoryItem} The item.
 */
const toListedItem = (item: MissingLabelsItem, lang: string, languages: string[]): ListedCategoryItem => {
  const candidates = [...languages, ...Object.keys(item.labels)]
  const sourceLang = candidates.find((other) => other !== lang && (item.labels[other] ?? '').trim() !== '') ?? null
  const fullText = sourceLang ? item.labels[sourceLang] : ''
  const truncated = fullText.length > CATEGORY_ITEM_LABEL_TEXT_MAX
  return {
    ref: item.codePath.join('.'),
    levelName: item.levelName,
    code: item.codePath[item.codePath.length - 1] ?? '',
    sourceLang,
    sourceText: truncated ? fullText.slice(0, CATEGORY_ITEM_LABEL_TEXT_MAX) : fullText,
    ...(truncated ? { sourceTextTruncated: true as const } : {}),
  }
}

/**
 * Consumes the items of a server page until the limit or the JSON budget is reached.
 * @param {MissingLabelsItem[]} items - Server items.
 * @param {PageState} state - Collected items (updated).
 * @param {PageParams} params - Parameters.
 * @returns {void}
 */
const collectItems = (items: MissingLabelsItem[], state: PageState, params: PageParams): void => {
  const { refs, surveyId, categoryUuid, lang, languages, pendingItemUuids, limit } = params
  for (const item of items) {
    const pending = pendingItemUuids.has(item.uuid)
    const listed = pending ? null : toListedItem(item, lang, languages)
    const itemSize = listed ? JSON.stringify(listed).length + 1 : 0
    // a page is cut only when it has items, so an oversized item still makes progress
    if (
      listed &&
      state.items.length > 0 &&
      (state.items.length >= limit || state.size + itemSize > RESULT_MAX_JSON_CHARS)
    ) {
      state.full = true
      return
    }
    const entry = { itemUuid: item.uuid, levelName: item.levelName, labels: item.labels }
    refs.register({ surveyId, categoryUuid, ref: item.codePath.join('.'), entry })
    if (listed) {
      state.items.push(listed)
      state.size += itemSize
    }
    state.lastConsumed = item.uuid
  }
}

/**
 * Returns the note telling the model how to go on.
 * @param {string|null} nextCursor - Next cursor.
 * @param {number} pendingCount - Labels of this category and language in pending cards.
 * @returns {string} The note.
 */
const buildNote = (nextCursor: string | null, pendingCount: number): string => {
  const parts = [nextCursor ? 'More items remain: call again with cursor = nextCursor.' : 'No more items.']
  if (pendingCount > 0) parts.push(`${pendingCount} items already in pending cards are not listed.`)
  return parts.join(' ')
}

/**
 * Creates the tool (the fetcher is injected in tests).
 * @param {object} [deps] - Dependencies.
 * @param {FetchMissingLabelsPage} [deps.fetchPage] - Missing-labels page fetcher.
 * @returns {AiTool} The tool.
 */
export const createCategoryItemsListMissingLabelsTool = ({
  fetchPage = fetchMissingLabelsPage,
}: { fetchPage?: FetchMissingLabelsPage } = {}): AiTool<ListMissingLabelsInput, ListMissingLabelsResult> => ({
  name: 'categoryItems_listMissingLabels',
  description:
    'Lists the items of a category whose label is missing in a survey language, with the text to translate ' +
    '(sourceText, in sourceLang). Pass nextCursor as cursor to get the next items. Items already in pending cards ' +
    'are skipped. Propose the translations with categoryItemLabels_proposeSet, using the ref of each item.',
  inputSchema: z.object({
    categoryName: z.string().min(1).max(100),
    lang: z.string().min(2).max(10).describe('The survey language whose labels are missing'),
    // an item uuid; not checked as a uuid (an unknown cursor restarts the list on the server)
    cursor: z.string().min(1).max(64).optional().describe('nextCursor of the previous call'),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  area: ['design'],
  dataClass: 'schema',
  effect: 'read',
  requires: canEditSurveyTool,
  execute: async ({ categoryName, lang, cursor, limit = LIST_MISSING_LABELS_DEFAULT_LIMIT }, ctx) => {
    const survey = requireSurvey(ctx)
    const category = requireCategory(survey, categoryName)
    const categoryUuid = Category.getUuid(category)
    checkScope(ctx, categoryUuid, categoryName)
    const languages = requireSurveyLanguage(survey, lang)
    const pendingItemUuids = getPendingItemUuids(ctx, categoryUuid, lang)
    const surveyId = Number(Survey.getId(survey))
    const params: PageParams = {
      refs: ctx.categoryItemRefs ?? createCategoryItemRefs(),
      surveyId,
      categoryUuid,
      lang,
      languages,
      pendingItemUuids,
      limit,
    }
    const state: PageState = { items: [], size: 400, lastConsumed: cursor ?? null, full: false }
    let serverCursor: string | null = cursor ?? null
    let serverTotal = 0
    for (let request = 0; request < LIST_MISSING_LABELS_MAX_REQUESTS && !state.full; request += 1) {
      const page = await fetchPage({
        surveyId,
        categoryUuid,
        lang,
        cursor: serverCursor,
        limit: LIST_MISSING_LABELS_SERVER_PAGE,
        signal: ctx.signal,
      })
      if (request === 0) serverTotal = page.total
      collectItems(page.items, state, params)
      serverCursor = page.nextCursor
      if (serverCursor === null) break
    }
    const nextCursor = state.full || serverCursor !== null ? state.lastConsumed : null
    return {
      categoryName,
      lang,
      total: Math.max(0, serverTotal - pendingItemUuids.size),
      items: state.items,
      nextCursor,
      note: buildNote(nextCursor, pendingItemUuids.size),
    }
  },
})

export const categoryItemsListMissingLabelsTool = createCategoryItemsListMissingLabelsTool()
