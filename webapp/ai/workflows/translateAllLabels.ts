// webapp/ai/workflows/translateAllLabels.ts
/**
 * "AI: Translate labels" of the Form Designer, run in the browser (it was the server job NodeDefsTranslationJob):
 * the label and description of every node def, in the default language, translated into the other survey languages
 * with the model of resolveModel. The result is the review data of NodeDefsTranslationModal.
 */
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as StringUtils from '@core/stringUtils'
import { AiLimits } from '@common/ai/limits'
import type { AiGenerateText } from '@common/ai/llm'
import { type AiTranslationItem, type AiTranslationResult, translateItems } from '@common/ai/tasks/translation'

import { resolveBatchModel } from './batchModel'
import { type AiBatchCall, type AiBatchGuard, type AiBatchProgress, chunkArray, runAiBatchCalls } from './batchRun'

// Items per AI call: 20, not AiLimits.translationMaxItems, because each item goes to up to 20 languages and small
// local models truncate bigger answers
export const TRANSLATION_BATCH_SIZE = 20

type ItemInfo = { uuid: string; field: 'label' | 'description' }

type TranslationItems = { items: AiTranslationItem[]; itemInfoById: Record<string, ItemInfo>; skippedCount: number }

type AiTranslationsByNodeDef = Record<string, { aiLabels: Record<string, string>; aiDescs: Record<string, string> }>

export type NodeDefsTranslationItem = {
  nodeDefUuid: string
  path: string
  defaultLangLabel: string
  defaultLangDescription: string
  existingLabelsByLang: Record<string, string>
  existingDescriptionsByLang: Record<string, string>
  aiLabelsByLang: Record<string, string>
  aiDescriptionsByLang: Record<string, string>
}

export type NodeDefsTranslationResult = {
  defaultLang: string
  languages: string[]
  otherLangs: string[]
  items: NodeDefsTranslationItem[]
  // label or description translations (text × language) the AI did not produce
  failedCount: number
}

type ProgressListener = (progress: AiBatchProgress) => void

/**
 * Adds one text to translate: blank texts are skipped, texts too long for the task are counted and skipped.
 * @param {TranslationItems} acc - Accumulator (mutated).
 * @param {object} params - Parameters.
 * @param {string} params.id - Item id.
 * @param {unknown} params.text - Text in the default language.
 * @param {string} params.kind - Item kind (prompt hint).
 * @param {ItemInfo} params.info - Node def and field of the item.
 * @param {number} params.maxChars - Longest text the task accepts.
 * @returns {void}
 */
const addItem = (
  acc: TranslationItems,
  { id, text, kind, info, maxChars }: { id: string; text: unknown; kind: string; info: ItemInfo; maxChars: number }
): void => {
  if (!StringUtils.isNotBlank(text)) return
  // the task would reject the whole batch (aiInputTooLong): this one text fails, not its 19 neighbours
  if (text.length > maxChars) {
    acc.skippedCount += 1
    return
  }
  acc.items.push({ id, text, kind })
  acc.itemInfoById[id] = info
}

/**
 * Builds the texts to translate (label and description of each node def, in the default language).
 * @param {object} params - Parameters.
 * @param {object[]} params.nodeDefs - Node defs.
 * @param {string} params.defaultLang - Default language of the survey.
 * @param {number} [params.maxChars] - Longest text the task accepts.
 * @returns {TranslationItems} The items, the node def of each item id, and the number of texts too long.
 */
export const buildTranslationItems = ({
  nodeDefs,
  defaultLang,
  maxChars = AiLimits.translationItemMaxChars,
}: {
  nodeDefs: any[]
  defaultLang: string
  maxChars?: number
}): TranslationItems => {
  const acc: TranslationItems = { items: [], itemInfoById: {}, skippedCount: 0 }
  for (const nodeDef of nodeDefs) {
    const uuid = NodeDef.getUuid(nodeDef)
    addItem(acc, {
      id: `${uuid}_label`,
      text: NodeDef.getLabels(nodeDef)[defaultLang],
      kind: 'nodeDefLabel',
      info: { uuid, field: 'label' },
      maxChars,
    })
    addItem(acc, {
      id: `${uuid}_desc`,
      text: NodeDef.getDescription(defaultLang)(nodeDef),
      kind: 'nodeDefDescription',
      info: { uuid, field: 'description' },
      maxChars,
    })
  }
  return acc
}

/**
 * Builds the calls: each item batch is sent once per group of target languages.
 * @param {object} params - Parameters.
 * @param {AiTranslationItem[]} params.items - Items to translate.
 * @param {string} params.sourceLang - Default language.
 * @param {string[]} params.otherLangs - Target languages.
 * @param {AiGenerateText} params.generateText - Text generator.
 * @param {Function} params.translate - The translation task.
 * @param {number} params.batchSize - Items per call.
 * @param {number} params.maxTargetLangs - Target languages per call.
 * @returns {AiBatchCall[]} The calls.
 */
const buildTranslationCalls = ({
  items,
  sourceLang,
  otherLangs,
  generateText,
  translate,
  batchSize,
  maxTargetLangs,
}: {
  items: AiTranslationItem[]
  sourceLang: string
  otherLangs: string[]
  generateText: AiGenerateText
  translate: typeof translateItems
  batchSize: number
  maxTargetLangs: number
}): AiBatchCall<AiTranslationResult>[] => {
  // the task accepts a limited number of target languages per call
  const langGroups = chunkArray(otherLangs, maxTargetLangs)
  return chunkArray(items, batchSize).flatMap((batch) =>
    langGroups.map((targetLangs) => ({
      size: batch.length * targetLangs.length,
      run: (signal?: AbortSignal) => translate({ generateText, sourceLang, targetLangs, items: batch, signal }),
    }))
  )
}

/**
 * Merges the translations of one call into the AI suggestions by node def.
 * @param {Array} translations - Translations of the call.
 * @param {object} itemInfoById - Node def and field of each item id.
 * @param {AiTranslationsByNodeDef} aiByNodeDef - Accumulator (mutated).
 * @returns {void}
 */
const applyTranslations = (
  translations: AiTranslationResult['translations'],
  itemInfoById: Record<string, ItemInfo>,
  aiByNodeDef: AiTranslationsByNodeDef
): void => {
  for (const { id, byLang } of translations) {
    // the model may return ids it was not asked for
    if (!Object.hasOwn(itemInfoById, id)) continue
    const { uuid, field } = itemInfoById[id]
    const entry = aiByNodeDef[uuid] ?? { aiLabels: {}, aiDescs: {} }
    if (field === 'label') entry.aiLabels = { ...entry.aiLabels, ...byLang }
    else entry.aiDescs = { ...entry.aiDescs, ...byLang }
    aiByNodeDef[uuid] = entry
  }
}

/**
 * Builds the review data of every node def (the result of the old job's beforeSuccess, plus the failed count).
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {string} params.defaultLang - Default language.
 * @param {string[]} params.languages - Survey languages.
 * @param {string[]} params.otherLangs - Languages other than the default one.
 * @param {AiTranslationsByNodeDef} params.aiByNodeDef - AI suggestions by node def uuid.
 * @param {number} params.failedCount - Translations the AI did not produce.
 * @returns {NodeDefsTranslationResult} The result.
 */
const buildNodeDefsTranslationResult = ({
  survey,
  defaultLang,
  languages,
  otherLangs,
  aiByNodeDef,
  failedCount,
}: {
  survey: any
  defaultLang: string
  languages: string[]
  otherLangs: string[]
  aiByNodeDef: AiTranslationsByNodeDef
  failedCount: number
}): NodeDefsTranslationResult => {
  const items: NodeDefsTranslationItem[] = Survey.getNodeDefDescendantsAndSelf()(survey).map((nodeDef: any) => {
    const uuid = NodeDef.getUuid(nodeDef)
    const labels = NodeDef.getLabels(nodeDef)
    const existingLabelsByLang: Record<string, string> = {}
    const existingDescriptionsByLang: Record<string, string> = {}
    for (const lang of otherLangs) {
      existingLabelsByLang[lang] = labels[lang] || ''
      existingDescriptionsByLang[lang] = NodeDef.getDescription(lang)(nodeDef) || ''
    }
    const ai = aiByNodeDef[uuid]
    return {
      nodeDefUuid: uuid,
      path: Survey.getNodeDefPath({ nodeDef })(survey),
      defaultLangLabel: labels[defaultLang] || '',
      defaultLangDescription: NodeDef.getDescription(defaultLang)(nodeDef) || '',
      existingLabelsByLang,
      existingDescriptionsByLang,
      aiLabelsByLang: ai?.aiLabels ?? {},
      aiDescriptionsByLang: ai?.aiDescs ?? {},
    }
  })
  return { defaultLang, languages, otherLangs, items, failedCount }
}

/**
 * Translates every label and description of the survey (testable core: generator, guard and task injected).
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey with its node defs (the store's survey).
 * @param {AiGenerateText} params.generateText - Text generator.
 * @param {AiBatchGuard} params.guard - Check run before each call.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @param {Function} [params.onProgress] - Progress listener ({ done, total } calls).
 * @param {Function} [params.translate] - The translation task (tests).
 * @param {number} [params.batchSize] - Items per call.
 * @param {number} [params.maxTargetLangs] - Target languages per call.
 * @returns {Promise<NodeDefsTranslationResult>} The review data.
 */
export const runTranslateAllLabels = async ({
  survey,
  generateText,
  guard,
  signal,
  onProgress,
  translate = translateItems,
  batchSize = TRANSLATION_BATCH_SIZE,
  maxTargetLangs = AiLimits.translationMaxTargetLangs,
}: {
  survey: any
  generateText: AiGenerateText
  guard: AiBatchGuard
  signal?: AbortSignal
  onProgress?: ProgressListener
  translate?: typeof translateItems
  batchSize?: number
  maxTargetLangs?: number
}): Promise<NodeDefsTranslationResult> => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const defaultLang: string = Survey.getDefaultLanguage(surveyInfo)
  const languages = Survey.getLanguages(surveyInfo) as unknown as string[]
  const otherLangs = languages.filter((lang) => lang !== defaultLang)
  const aiByNodeDef: AiTranslationsByNodeDef = {}
  const resultParams = { survey, defaultLang, languages, otherLangs, aiByNodeDef }
  if (otherLangs.length === 0) return buildNodeDefsTranslationResult({ ...resultParams, failedCount: 0 })

  const { items, itemInfoById, skippedCount } = buildTranslationItems({
    nodeDefs: Survey.getNodeDefsArray(survey),
    defaultLang,
  })
  const calls = buildTranslationCalls({
    items,
    sourceLang: defaultLang,
    otherLangs,
    generateText,
    translate,
    batchSize,
    maxTargetLangs,
  })
  const { failedCount } = await runAiBatchCalls({
    calls,
    guard,
    signal,
    onProgress,
    onResult: ({ translations }) => applyTranslations(translations, itemInfoById, aiByNodeDef),
  })
  // a text too long for the task is never sent: it counts as failed in every language
  return buildNodeDefsTranslationResult({
    ...resultParams,
    failedCount: failedCount + skippedCount * otherLangs.length,
  })
}

/**
 * Translates every label and description of the survey with the model of the translation feature.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey with its node defs (the store's survey).
 * @param {number} params.surveyId - Survey id.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @param {Function} [params.onProgress] - Progress listener.
 * @returns {Promise<NodeDefsTranslationResult>} The review data.
 */
export const translateAllLabelsWorkflow = async ({
  survey,
  surveyId,
  signal,
  onProgress,
}: {
  survey: any
  surveyId: number
  signal?: AbortSignal
  onProgress?: ProgressListener
}): Promise<NodeDefsTranslationResult> => {
  const { generateText, guard } = await resolveBatchModel({ feature: 'translation', surveyId, signal })
  return runTranslateAllLabels({ survey, generateText, guard, signal, onProgress })
}
