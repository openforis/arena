/**
 * The category item labels missing in a language (the "category labels missing in <language>" suggestion), read from
 * the server and translated with the calls of "AI: Translate labels": the chat batch of its Do it proposes them as one
 * change set.
 */
import {
  CATEGORY_ITEM_LABEL_TEXT_MAX,
  MISSING_LABELS_SERVER_PAGE_MAX,
  type MissingLabelsItem,
} from '@common/ai/categoryItemLabels'
import { AiLimits } from '@common/ai/limits'
import type { AiGenerateText } from '@common/ai/llm'
import { translateItems } from '@common/ai/tasks/translation'
import * as StringUtils from '@core/stringUtils'
import {
  type FetchMissingLabelsPage,
  fetchMissingLabelsPage,
} from '../changeSets/categoryItemLabels/categoryItemLabelsApi'
import { CATEGORY_ITEM_LABEL_SET } from '../changeSets/categoryItemLabels/types'
import { findTranslationSource, type TranslationSource } from '../changeSets/translationSource'
import type { ChangeOperationDraft } from '../changeSets/types'

import type { AiBatchGuard, AiBatchProgress, AiBatchStop } from './batchRun'
import { translateRowsToLang, TRANSLATION_BATCH_SIZE } from './translateAllLabels'

// shortcut: one run takes at most this many items (the review dialog of the card renders every change); the
// suggestion shows again with the rest. Raise it when the review dialog is virtualised.
export const CATEGORY_LABELS_RUN_MAX_ITEMS = 1000

export type CategoryLabelsCategory = { uuid: string; name: string }

// an item whose label is missing in the target language, with the label the translation is made from
export type CategoryLabelRow = {
  categoryUuid: string
  categoryName: string
  itemUuid: string
  // code path of the item ("2.14")
  ref: string
  levelName: string
  source: TranslationSource
}

export type CategoryLabelsTranslationResult = {
  lang: string
  // the rows the AI translated, in category order
  rows: (CategoryLabelRow & { aiText: string })[]
  // labels the AI did not produce, the source texts too long included
  failedCount: number
  // labels a stop kept the run from asking for (not failures)
  notDoneCount?: number
  stop?: AiBatchStop
}

/**
 * Builds the rows of the items of a category: the label is missing in the target language and another language
 * (the default one first) has it.
 * @param {object} params - Parameters.
 * @param {MissingLabelsItem[]} params.items - Items of the category, as the server lists them.
 * @param {string} params.lang - Target language.
 * @param {string[]} params.languages - Survey languages, default first.
 * @param {number} [params.maxChars] - Longest text the translation task accepts.
 * @returns {object} The rows, and the number of items whose source label is too long.
 */
export const buildCategoryLabelRows = ({
  items,
  category,
  lang,
  languages,
  maxChars = AiLimits.translationItemMaxChars,
}: {
  items: MissingLabelsItem[]
  category: CategoryLabelsCategory
  lang: string
  languages: string[]
  maxChars?: number
}): { rows: CategoryLabelRow[]; skippedCount: number } => {
  const rows: CategoryLabelRow[] = []
  let skippedCount = 0
  for (const item of items) {
    if (StringUtils.isNotBlank(item.labels[lang])) continue
    const source = findTranslationSource({ texts: item.labels, lang, languages })
    if (!source) continue
    // the task would reject the whole call: this one label fails, not its neighbours
    if (source.text.length > maxChars) {
      skippedCount += 1
      continue
    }
    rows.push({
      categoryUuid: category.uuid,
      categoryName: category.name,
      itemUuid: item.uuid,
      ref: item.codePath.join('.'),
      levelName: item.levelName,
      source,
    })
  }
  return { rows, skippedCount }
}

/**
 * Reads the items missing the label, category by category and page by page, up to maxItems rows.
 * @param {object} params - Parameters.
 * @param {CategoryLabelsCategory[]} params.categories - Categories of the suggestion.
 * @param {string} params.lang - Target language.
 * @param {string[]} params.languages - Survey languages, default first.
 * @param {FetchMissingLabelsPage} [params.fetchPage] - Page request.
 * @param {number} [params.maxItems] - Most rows of one run.
 * @returns {Promise<object>} The rows, and the number of items whose source label is too long.
 */
export const loadCategoryLabelRows = async ({
  surveyId,
  categories,
  lang,
  languages,
  fetchPage = fetchMissingLabelsPage,
  signal,
  maxItems = CATEGORY_LABELS_RUN_MAX_ITEMS,
}: {
  surveyId: number
  categories: CategoryLabelsCategory[]
  lang: string
  languages: string[]
  fetchPage?: FetchMissingLabelsPage
  signal?: AbortSignal
  maxItems?: number
}): Promise<{ rows: CategoryLabelRow[]; skippedCount: number }> => {
  const rows: CategoryLabelRow[] = []
  let skippedCount = 0
  for (const category of categories) {
    let cursor: string | null = null
    do {
      if (rows.length >= maxItems) return { rows: rows.slice(0, maxItems), skippedCount }
      // pages are read one after the other: the next request needs the cursor of the previous answer
      const page = await /* NOSONAR */ fetchPage({
        surveyId,
        categoryUuid: category.uuid,
        lang,
        cursor,
        limit: MISSING_LABELS_SERVER_PAGE_MAX,
        signal,
      })
      const built = buildCategoryLabelRows({ items: page.items, category, lang, languages })
      rows.push(...built.rows)
      skippedCount += built.skippedCount
      cursor = page.nextCursor
    } while (cursor)
  }
  return { rows: rows.slice(0, maxItems), skippedCount }
}

/**
 * Translates the rows (testable core: generator, guard and task injected). The rows are sent by source language.
 * @param {object} params - Parameters.
 * @param {CategoryLabelRow[]} params.rows - Rows to translate.
 * @param {string} params.lang - Target language.
 * @param {number} [params.skippedCount] - Items never sent (source too long): they count as failed.
 * @param {AiGenerateText} params.generateText - Text generator.
 * @param {AiBatchGuard} params.guard - Check run before each call.
 * @param {Function} [params.onProgress] - Progress listener ({ done, total } calls).
 * @param {Function} [params.translate] - The translation task (tests).
 * @param {number} [params.batchSize] - Items per call.
 * @returns {Promise<CategoryLabelsTranslationResult>} The translated rows; after a stop, those translated until then.
 */
export const runTranslateCategoryItemLabels = async ({
  rows,
  lang,
  skippedCount = 0,
  generateText,
  guard,
  signal,
  onProgress,
  translate = translateItems,
  batchSize = TRANSLATION_BATCH_SIZE,
}: {
  rows: CategoryLabelRow[]
  lang: string
  skippedCount?: number
  generateText: AiGenerateText
  guard: AiBatchGuard
  signal?: AbortSignal
  onProgress?: (progress: AiBatchProgress) => void
  translate?: typeof translateItems
  batchSize?: number
}): Promise<CategoryLabelsTranslationResult> => {
  const { translated, failedCount, notDoneCount, stop } = await translateRowsToLang({
    rows,
    toItem: (row) => ({ id: row.itemUuid, kind: 'categoryItemLabel' }),
    lang,
    maxLength: CATEGORY_ITEM_LABEL_TEXT_MAX,
    generateText,
    guard,
    signal,
    onProgress,
    translate,
    batchSize,
  })
  const result = { lang, rows: translated, failedCount: failedCount + skippedCount }
  return stop ? { ...result, notDoneCount, stop } : result
}

/**
 * Builds the drafts of the translated labels: proposed over a missing label, so a label added meanwhile is a conflict
 * at Apply, not overwritten.
 * @param {object[]} rows - Translated rows.
 * @param {string} lang - Target language.
 */
export const toCategoryLabelDrafts = (
  rows: (CategoryLabelRow & { aiText: string })[],
  lang: string
): ChangeOperationDraft[] =>
  rows.map(({ categoryUuid, itemUuid, ref, levelName, source, aiText }) => ({
    type: CATEGORY_ITEM_LABEL_SET,
    categoryUuid,
    itemUuid,
    ref,
    levelName,
    lang,
    text: aiText,
    expectedText: null,
    source,
  }))
