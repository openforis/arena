/**
 * The texts missing in a language (the rule of the "texts missing in <language>" suggestion), translated with the
 * calls of "AI: Translate labels": the chat batch of a Do it with many texts proposes them as one change set.
 */
import * as NodeDef from '@core/survey/nodeDef'
import { AiLimits } from '@common/ai/limits'
import type { AiGenerateText } from '@common/ai/llm'
import { translateItems } from '@common/ai/tasks/translation'

import { findTranslationSource, type TranslationSource } from '../changeSets/translationSource'
import type { LabelKind } from '../changeSets/types'
import {
  TEXT_KINDS,
  getMissingLanguages,
  getSurveyLanguages,
  getTextNodeDefs,
  toTextTargetKey,
} from '../tools/design/missingTexts'
import type { AiBatchGuard, AiBatchProgress } from './batchRun'
import { TRANSLATION_BATCH_SIZE, translateRowsToLang, type TranslatedRows } from './translateAllLabels'

// shortcut: one run takes at most this many texts (the review dialog of the card renders every change); the
// suggestion shows again with the rest. Raise it when the review dialog is virtualised.
export const MISSING_TEXTS_RUN_MAX_ITEMS = 1000

// a label or description missing in the target language, with the text the translation is made from
export type MissingTextRow = { nodeDefUuid: string; kind: LabelKind; source: TranslationSource }

const getTexts = (nodeDef: any, kind: LabelKind): Record<string, string> =>
  kind === 'labels' ? NodeDef.getLabels(nodeDef) : NodeDef.getDescriptions(nodeDef)

/**
 * Builds the rows of the texts missing in a language (the rule of the suggestion), in survey hierarchy order.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {string} params.lang - Target language.
 * @param {number} [params.maxChars] - Longest source text the task accepts.
 * @param {number} [params.maxItems] - Rows of one run.
 * @returns {object} The rows and the number of source texts too long to send.
 */
export const buildMissingTextRows = ({
  survey,
  lang,
  maxChars = AiLimits.translationItemMaxChars,
  maxItems = MISSING_TEXTS_RUN_MAX_ITEMS,
}: {
  survey: any
  lang: string
  maxChars?: number
  maxItems?: number
}): { rows: MissingTextRow[]; skippedCount: number } => {
  const languages = getSurveyLanguages(survey)
  const rows: MissingTextRow[] = []
  let skippedCount = 0
  for (const nodeDef of getTextNodeDefs(survey)) {
    for (const kind of TEXT_KINDS) {
      if (!getMissingLanguages(nodeDef, kind, languages).includes(lang)) continue
      const source = findTranslationSource({ texts: getTexts(nodeDef, kind), lang, languages })
      if (!source) continue
      // the task would reject the whole call: this one text fails, not its neighbours
      if (source.text.length > maxChars) skippedCount += 1
      else rows.push({ nodeDefUuid: NodeDef.getUuid(nodeDef), kind, source })
    }
  }
  return { rows: rows.slice(0, maxItems), skippedCount }
}

/**
 * Translates the rows into the target language (generator, guard and task injected).
 * @param {object} params - Parameters.
 * @param {string} params.lang - Target language.
 * @param {MissingTextRow[]} params.rows - Texts to translate.
 * @param {number} [params.skippedCount] - Source texts too long to send (counted as failed).
 * @param {AiGenerateText} params.generateText - Text generator.
 * @param {AiBatchGuard} params.guard - Check run before each call.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @param {Function} [params.onProgress] - Progress listener.
 * @param {Function} [params.translate] - The translation task (tests).
 * @param {number} [params.batchSize] - Items per call.
 * @returns {Promise<TranslatedRows>} The translated rows (after a stop, those translated until then) and the counts.
 */
export const runTranslateMissingTexts = async ({
  lang,
  rows,
  skippedCount = 0,
  generateText,
  guard,
  signal,
  onProgress,
  translate = translateItems,
  batchSize = TRANSLATION_BATCH_SIZE,
}: {
  lang: string
  rows: MissingTextRow[]
  skippedCount?: number
  generateText: AiGenerateText
  guard: AiBatchGuard
  signal?: AbortSignal
  onProgress?: (progress: AiBatchProgress) => void
  translate?: typeof translateItems
  batchSize?: number
}): Promise<TranslatedRows<MissingTextRow>> => {
  const result = await translateRowsToLang({
    rows,
    toItem: ({ nodeDefUuid, kind }) => ({
      id: toTextTargetKey(nodeDefUuid, kind),
      kind: kind === 'labels' ? 'nodeDefLabel' : 'nodeDefDescription',
    }),
    lang,
    maxLength: AiLimits.translationItemMaxChars,
    generateText,
    guard,
    signal,
    onProgress,
    translate,
    batchSize,
  })
  return { ...result, failedCount: result.failedCount + skippedCount }
}
