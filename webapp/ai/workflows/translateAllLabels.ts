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
import {
  type AiBatchCall,
  type AiBatchGuard,
  type AiBatchProgress,
  type AiBatchStop,
  chunkArray,
  runAiBatchCalls,
} from './batchRun'

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
  // label or description translations (text × language) the AI did not produce, those of a stopped run included
  failedCount: number
  // present when the run stopped before its last call: the items hold what was translated until then
  stop?: AiBatchStop
}

// what applyTranslations needs to know about the call a translation list answers
type TranslationOutcome = AiTranslationResult & { itemIds: string[]; targetLangs: string[] }

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
}): AiBatchCall<TranslationOutcome>[] => {
  // the task accepts a limited number of target languages per call
  const langGroups = chunkArray(otherLangs, maxTargetLangs)
  return chunkArray(items, batchSize).flatMap((batch) =>
    langGroups.map((targetLangs) => ({
      size: batch.length * targetLangs.length,
      run: async (signal?: AbortSignal) => ({
        ...(await translate({ generateText, sourceLang, targetLangs, items: batch, signal })),
        itemIds: batch.map(({ id }) => id),
        targetLangs,
      }),
    }))
  )
}

/**
 * Merges the translations of one call into the AI suggestions by node def.
 * @param {TranslationOutcome} outcome - Translations of the call, with the items and languages it asked for.
 * @param {object} itemInfoById - Node def and field of each item id.
 * @param {AiTranslationsByNodeDef} aiByNodeDef - Accumulator (mutated).
 * @returns {number} The translations kept (item of the call × target language of the call, not blank).
 */
const applyTranslations = (
  { translations, itemIds, targetLangs }: TranslationOutcome,
  itemInfoById: Record<string, ItemInfo>,
  aiByNodeDef: AiTranslationsByNodeDef
): number => {
  const askedIds = new Set(itemIds)
  const keptKeys = new Set<string>()
  for (const { id, byLang } of translations) {
    // the model may return ids or languages it was not asked for
    if (!askedIds.has(id) || !Object.hasOwn(itemInfoById, id)) continue
    const kept = Object.fromEntries(
      Object.entries(byLang).filter(([lang, text]) => targetLangs.includes(lang) && StringUtils.isNotBlank(text))
    )
    if (Object.keys(kept).length === 0) continue
    for (const lang of Object.keys(kept)) keptKeys.add(`${id}\u0000${lang}`)
    const { uuid, field } = itemInfoById[id]
    const entry = aiByNodeDef[uuid] ?? { aiLabels: {}, aiDescs: {} }
    if (field === 'label') entry.aiLabels = { ...entry.aiLabels, ...kept }
    else entry.aiDescs = { ...entry.aiDescs, ...kept }
    aiByNodeDef[uuid] = entry
  }
  return keptKeys.size
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
 * @returns {Promise<NodeDefsTranslationResult>} The review data; after a stop, what was translated until then.
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
  // core/survey is untyped JS: the inferred return type of getLanguages is not string[], but it is the codes array
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
  // translations the model silently dropped in calls that succeeded
  let missingCount = 0
  const { failedCount, stop } = await runAiBatchCalls({
    calls,
    guard,
    signal,
    onProgress,
    onResult: (outcome) => {
      const kept = applyTranslations(outcome, itemInfoById, aiByNodeDef)
      missingCount += outcome.itemIds.length * outcome.targetLangs.length - kept
    },
  })
  // a text too long for the task is never sent: it counts as failed in every language
  const result = buildNodeDefsTranslationResult({
    ...resultParams,
    failedCount: failedCount + missingCount + skippedCount * otherLangs.length,
  })
  return stop ? { ...result, stop } : result
}

/**
 * Tells whether the survey has another language and at least one text to send to the model.
 * @param {object} survey - Survey with its node defs.
 * @returns {boolean} True when a call is needed.
 */
const hasTextToTranslate = (survey: any): boolean => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const defaultLang: string = Survey.getDefaultLanguage(surveyInfo)
  const hasOtherLang = (Survey.getLanguages(surveyInfo) as unknown as string[]).some((lang) => lang !== defaultLang)
  return (
    hasOtherLang && buildTranslationItems({ nodeDefs: Survey.getNodeDefsArray(survey), defaultLang }).items.length > 0
  )
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
  const noModel: AiGenerateText = async () => {
    throw new Error('no AI call expected')
  }
  // nothing to translate (one language, or no text): no model, no consent dialog
  if (!hasTextToTranslate(survey)) {
    return runTranslateAllLabels({ survey, generateText: noModel, guard: async () => {} })
  }
  const { generateText, guard } = await resolveBatchModel({ feature: 'translation', surveyId, signal })
  return runTranslateAllLabels({ survey, generateText, guard, signal, onProgress })
}
