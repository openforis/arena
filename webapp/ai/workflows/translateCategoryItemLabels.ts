/**
 * Do it of the "category labels missing in <language>" suggestion, run as a browser batch: the items missing the
 * label are read from the server, translated with the calls of "AI: Translate labels", reviewed, then written through
 * the Apply path of the assistant's category label cards (server checks, compare and set, per-request limit).
 */
import * as StringUtils from '@core/stringUtils'
import {
  CATEGORY_ITEM_LABEL_TEXT_MAX,
  CATEGORY_ITEM_LABELS_UPDATE_MAX,
  MISSING_LABELS_SERVER_PAGE_MAX,
  type MissingLabelsItem,
} from '@common/ai/categoryItemLabels'
import { AiLimits } from '@common/ai/limits'
import type { AiGenerateText } from '@common/ai/llm'
import { translateItems } from '@common/ai/tasks/translation'

import {
  applyCategoryItemLabels,
  type CategoryLabelsApplierDeps,
} from '../changeSets/categoryItemLabels/applyCategoryItemLabels'
import {
  fetchMissingLabelsPage,
  type FetchMissingLabelsPage,
} from '../changeSets/categoryItemLabels/categoryItemLabelsApi'
import { CATEGORY_ITEM_LABEL_SET, type CategoryItemLabelSetOperation } from '../changeSets/categoryItemLabels/types'
import { findTranslationSource, type TranslationSource } from '../changeSets/translationSource'
import type { OperationResult } from '../changeSets/types'
import { resolveBatchModel } from './batchModel'
import { type AiBatchGuard, type AiBatchProgress, type AiBatchStop, chunkArray, runAiBatchCalls } from './batchRun'
import { buildTranslationCalls, TRANSLATION_BATCH_SIZE, type NodeDefsTranslationItem } from './translateAllLabels'

// shortcut: one run takes at most this many items (the review table renders every row); the suggestion shows again
// with the rest. Raise it when the review table is virtualised.
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
 * @param {CategoryLabelsCategory} params.category - Category.
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
 * @param {number} params.surveyId - Survey id.
 * @param {CategoryLabelsCategory[]} params.categories - Categories of the suggestion.
 * @param {string} params.lang - Target language.
 * @param {string[]} params.languages - Survey languages, default first.
 * @param {FetchMissingLabelsPage} [params.fetchPage] - Page request.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
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
      const page = await fetchPage({
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
 * @param {AbortSignal} [params.signal] - Cancellation signal.
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
  const sourceLangs = [...new Set(rows.map((row) => row.source.lang))]
  const calls = sourceLangs.flatMap((sourceLang) =>
    buildTranslationCalls({
      items: rows
        .filter((row) => row.source.lang === sourceLang)
        .map((row) => ({ id: row.itemUuid, text: row.source.text, kind: 'categoryItemLabel' })),
      sourceLang,
      otherLangs: [lang],
      generateText,
      translate,
      batchSize,
      maxTargetLangs: 1,
    })
  )
  const aiTextByItem = new Map<string, string>()
  const { stop, notRunCount } = await runAiBatchCalls({
    calls,
    guard,
    signal,
    onProgress,
    onResult: ({ translations, itemIds }) => {
      for (const { id, byLang } of translations) {
        const text = (byLang[lang] ?? '').trim()
        // the model may return ids it was not asked for; a text the server would refuse counts as not produced
        if (itemIds.includes(id) && text !== '' && text.length <= CATEGORY_ITEM_LABEL_TEXT_MAX) {
          aiTextByItem.set(id, text)
        }
      }
    },
  })
  const translated = rows.flatMap((row) => {
    const aiText = aiTextByItem.get(row.itemUuid)
    return aiText === undefined ? [] : [{ ...row, aiText }]
  })
  const notDoneCount = Math.min(notRunCount, rows.length - translated.length)
  const failedCount = rows.length - translated.length - notDoneCount + skippedCount
  const result = { lang, rows: translated, failedCount }
  return stop ? { ...result, notDoneCount, stop } : result
}

/**
 * Translates the missing category item labels of a language with the model of the translation feature.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Survey id.
 * @param {CategoryLabelsCategory[]} params.categories - Categories of the suggestion.
 * @param {string} params.lang - Target language.
 * @param {string[]} params.languages - Survey languages, default first.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @param {Function} [params.onProgress] - Progress listener.
 * @returns {Promise<CategoryLabelsTranslationResult>} The review data.
 */
export const translateCategoryItemLabelsWorkflow = async ({
  surveyId,
  categories,
  lang,
  languages,
  signal,
  onProgress,
}: {
  surveyId: number
  categories: CategoryLabelsCategory[]
  lang: string
  languages: string[]
  signal?: AbortSignal
  onProgress?: (progress: AiBatchProgress) => void
}): Promise<CategoryLabelsTranslationResult> => {
  const { rows, skippedCount } = await loadCategoryLabelRows({ surveyId, categories, lang, languages, signal })
  // nothing to send: no model, no consent dialog
  if (rows.length === 0) return { lang, rows: [], failedCount: skippedCount }
  const { generateText, guard } = await resolveBatchModel({ feature: 'translation', surveyId, signal })
  return runTranslateCategoryItemLabels({ rows, lang, skippedCount, generateText, guard, signal, onProgress })
}

/**
 * Converts the translated rows to the items of the translation review modal (one row per category item).
 * @param {CategoryLabelsTranslationResult} result - Result of the run.
 * @returns {NodeDefsTranslationItem[]} The items; nodeDefUuid holds the category item uuid.
 */
export const toCategoryLabelReviewItems = ({
  lang,
  rows,
}: CategoryLabelsTranslationResult): NodeDefsTranslationItem[] =>
  rows.map((row) => ({
    nodeDefUuid: row.itemUuid,
    path: `${row.categoryName} / ${row.ref}`,
    defaultLangLabel: row.source.text,
    defaultLangDescription: '',
    existingLabelsByLang: {},
    existingDescriptionsByLang: {},
    aiLabelsByLang: { [lang]: row.aiText },
    aiDescriptionsByLang: {},
  }))

/**
 * Builds the label operations of the reviewed rows. A row left blank is not written; a text longer than the server
 * accepts is counted, not sent (it would fail its whole request).
 * @param {object} params - Parameters.
 * @param {CategoryLabelRow[]} params.rows - Rows of the run.
 * @param {string} params.lang - Target language.
 * @param {Record<string, string>} params.textByItemUuid - Reviewed text of each row.
 * @returns {object} The operations, and the number of texts too long.
 */
export const buildCategoryLabelOperations = ({
  rows,
  lang,
  textByItemUuid,
}: {
  rows: CategoryLabelRow[]
  lang: string
  textByItemUuid: Record<string, string | undefined>
}): { operations: CategoryItemLabelSetOperation[]; tooLongCount: number } => {
  const operations: CategoryItemLabelSetOperation[] = []
  let tooLongCount = 0
  for (const { categoryUuid, itemUuid, ref, levelName, source } of rows) {
    const text = (textByItemUuid[itemUuid] ?? '').trim()
    if (text === '') continue
    if (text.length > CATEGORY_ITEM_LABEL_TEXT_MAX) {
      tooLongCount += 1
      continue
    }
    operations.push({
      id: itemUuid,
      type: CATEGORY_ITEM_LABEL_SET,
      categoryUuid,
      itemUuid,
      ref,
      levelName,
      lang,
      text,
      // the label was missing when the item was listed: a label added meanwhile is a conflict, not overwritten
      expectedText: null,
      source,
    })
  }
  return { operations, tooLongCount }
}

/**
 * Writes the operations through the Apply path of the category label cards, one request per chunk (the server
 * limit). The store is refreshed and the suggestion event sent once, after the last chunk.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Survey id.
 * @param {CategoryItemLabelSetOperation[]} params.operations - Operations to write.
 * @param {Function} params.getSurvey - Returns the open survey.
 * @param {CategoryLabelsApplierDeps} params.deps - Server call and store updates.
 * @param {number} [params.chunkSize] - Labels per request.
 * @returns {Promise<object>} How many labels were written and how many were not (conflict, failed or skipped).
 */
export const applyCategoryLabelOperations = async ({
  surveyId,
  operations,
  getSurvey,
  deps,
  chunkSize = CATEGORY_ITEM_LABELS_UPDATE_MAX,
}: {
  surveyId: number
  operations: CategoryItemLabelSetOperation[]
  getSurvey: () => any
  deps: CategoryLabelsApplierDeps
  chunkSize?: number
}): Promise<{ appliedCount: number; notAppliedCount: number }> => {
  const results = new Map<string, OperationResult>()
  const categoriesByUuid = new Map<string, any>()
  // a defs reload per chunk would reload the survey under the next chunk
  const chunkDeps: CategoryLabelsApplierDeps = {
    putCategoryItemLabels: deps.putCategoryItemLabels,
    onCategoriesUpdated: (categories) => {
      for (const category of categories) categoriesByUuid.set(category.uuid, category)
    },
    onCategoryLabelsApplied: () => undefined,
  }
  const changeSet = {
    id: 'categoryLabelsBatch',
    surveyId,
    summary: '',
    operations,
    createdAt: new Date().toISOString(),
  }
  for (const chunk of chunkArray(operations, chunkSize)) {
    await applyCategoryItemLabels({ changeSet, operations: chunk, getSurvey, deps: chunkDeps, results })
  }
  const appliedCount = [...results.values()].filter(({ status }) => status === 'applied').length
  if (categoriesByUuid.size > 0) deps.onCategoriesUpdated([...categoriesByUuid.values()])
  if (appliedCount > 0) deps.onCategoryLabelsApplied()
  return { appliedCount, notAppliedCount: operations.length - appliedCount }
}
