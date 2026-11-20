/**
 * The batches of the assistant: the texts missing in a language, the category item labels missing in a language and
 * the descriptions of the entries without one. They are made with batch AI requests (not with the model's tools, which
 * would propose a few texts at a time) and proposed on one change set card. Run by the Do it of a suggestion
 * (runSuggestionBatchTurn) and by the batch tools of the model (tools/design/batchTools).
 */
import { getLanguageLabel } from '@core/app/languages'
import * as Category from '@core/survey/category'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import type { AiFeatureKey } from '@common/ai/features'
import { AiLimits } from '@common/ai/limits'
import type { AiDataDictionaryNodeDef, generateDataDictionaryDescriptions } from '@common/ai/tasks/dataDictionary'
import type { translateItems } from '@common/ai/tasks/translation'
import type { FetchMissingLabelsPage } from '@webapp/ai/changeSets/categoryItemLabels/categoryItemLabelsApi'
import { getLabelValue } from '@webapp/ai/changeSets/operations'
import type { ChangeOperationDraft } from '@webapp/ai/changeSets/types'
import { hasDescription } from '@webapp/ai/suggestions/detectors/newEntriesDescriptions'
import {
  withRemainingTime,
  type SuggestionBatchKind,
  type SuggestionBatchProgress,
} from '@webapp/ai/suggestions/suggestionBatchTurn'
import type { SuggestionScope } from '@webapp/ai/suggestions/types'
import { getSurveyLanguages, getTextNodeDefs } from '@webapp/ai/tools/design/missingTexts'

import { type AiBatchModel, resolveBatchModel } from './batchModel'
import type { AiBatchProgress, AiBatchStop } from './batchRun'
import { runDataDictionaryDescriptions } from './dataDictionary'
import { TRANSLATION_BATCH_SIZE, translateRowsToLang } from './translateAllLabels'
import {
  loadCategoryLabelRows,
  runTranslateCategoryItemLabels,
  toCategoryLabelDrafts,
} from './translateCategoryItemLabels'
import { buildMissingTextRows, runTranslateMissingTexts, type MissingTextRow } from './translateMissingTexts'

// injected by tests
export type AssistantBatchDeps = {
  translate?: typeof translateItems
  describe?: typeof generateDataDictionaryDescriptions
  fetchPage?: FetchMissingLabelsPage
}

type LoadParams = { survey: any; lang: string; scope: SuggestionScope; signal: AbortSignal; deps: AssistantBatchDeps }

type RunParams = {
  survey: any
  rows: any[]
  lang: string
  skippedCount: number
  getModel: (feature: AiFeatureKey) => Promise<AiBatchModel>
  signal: AbortSignal
  onProgress: (progress: AiBatchProgress) => void
  deps: AssistantBatchDeps
}

type RunResult = { translated: any[]; failedCount: number; stop?: AiBatchStop }

type BatchKindDef = {
  // messages of the batch turn: aiAssistant.missingTextsBatch.<key>
  messageKeys: { start: string; summary: string; done: string; failed: string; nothing: string }
  // the language(s) named in the messages
  getLangLabel: (survey: any, lang: string) => string
  // the texts to make, and the number of those that cannot be sent (too long, over the limit)
  loadRows: (params: LoadParams) => Promise<{ rows: any[]; skippedCount: number }>
  run: (params: RunParams) => Promise<RunResult>
  // the survey as it is at the end: a text filled or a node definition deleted during the run is left out
  toDrafts: (survey: any, lang: string, translated: any[]) => ChangeOperationDraft[]
}

const toLangLabel = (lang: string): string => getLanguageLabel(lang) || lang

/**
 * Builds the drafts of node definition texts that are still empty.
 * @param {object} survey - Survey as it is now.
 * @param {object[]} texts - Texts: node definition, kind, language and text.
 * @returns {ChangeOperationDraft[]} The drafts.
 */
const toTextDrafts = (
  survey: any,
  texts: { nodeDefUuid: string; kind: 'labels' | 'descriptions'; lang: string; aiText: string }[]
): ChangeOperationDraft[] => {
  const drafts: ChangeOperationDraft[] = []
  for (const { nodeDefUuid, kind, lang, aiText } of texts) {
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    if (nodeDef && !getLabelValue(nodeDef, kind, lang)) {
      drafts.push({ type: 'label.set', nodeDefUuid, kind, lang, from: null, to: aiText })
    }
  }
  return drafts
}

/**
 * Returns the categories to translate that exist: the targets of the suggestion, or every category.
 * @param {object} survey - Survey.
 * @param {string[]} uuids - Category uuids (none: all).
 * @returns {object[]} The categories, with their names.
 */
const toCategories = (survey: any, uuids: string[]) => {
  const categories =
    uuids.length > 0 ? uuids.map((uuid) => Survey.getCategoryByUuid(uuid)(survey)) : Survey.getCategoriesArray(survey)
  return categories.flatMap((category: any) =>
    category ? [{ uuid: Category.getUuid(category), name: Category.getName(category) }] : []
  )
}

/**
 * Returns the parent path of a node definition (the root left out), as the data dictionary export sends it.
 * @param {object} survey - Survey.
 * @param {object} nodeDef - Node definition.
 * @returns {string} Names of the ancestors, joined by "/".
 */
const getParentPath = (survey: any, nodeDef: any): string => {
  const names: string[] = []
  let parent = Survey.getNodeDefParent(nodeDef)(survey)
  while (parent && !NodeDef.isRoot(parent)) {
    names.unshift(NodeDef.getName(parent))
    parent = Survey.getNodeDefParent(parent)(survey)
  }
  return names.join('/')
}

/**
 * Loads the entries to describe: the targets of the suggestion (all entries when none) without a description in any
 * language.
 * @param {LoadParams} params - Parameters.
 * @returns {object} The rows (at most the limit of a run) and the number left over.
 */
const loadDescriptionRows = ({ survey, scope }: LoadParams) => {
  const languages = getSurveyLanguages(survey)
  const nodeDefs =
    scope.targetKeys.length > 0
      ? scope.targetKeys.map((uuid) => Survey.getNodeDefByUuid(uuid)(survey))
      : getTextNodeDefs(survey)
  const rows: AiDataDictionaryNodeDef[] = nodeDefs
    .filter((nodeDef: any) => nodeDef && !hasDescription(nodeDef, languages))
    .map((nodeDef: any) => ({
      uuid: NodeDef.getUuid(nodeDef),
      name: NodeDef.getName(nodeDef),
      label: NodeDef.getLabels(nodeDef)[languages[0]] || undefined,
      type: NodeDef.getType(nodeDef),
      parentPath: getParentPath(survey, nodeDef),
    }))
  const max = AiLimits.dataDictionaryMaxDescriptions
  return { rows: rows.slice(0, max), skippedCount: Math.max(0, rows.length - max) }
}

/**
 * Sums the progress of the phases of a run (the calls of the later phases estimated until they start).
 * @param {number[]} estimatedTotals - Calls of each phase.
 * @param {Function} onProgress - Listener of the whole run.
 * @returns {Function} Returns the listener of a phase by index; end(index) closes a phase.
 */
const createPhasedProgress = (estimatedTotals: number[], onProgress: (progress: AiBatchProgress) => void) => {
  const totals = [...estimatedTotals]
  const dones = totals.map(() => 0)
  const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0)
  return (index: number) =>
    ({ done, total }: AiBatchProgress) => {
      totals[index] = total
      dones[index] = done
      onProgress({ done: sum(dones), total: sum(totals) })
    }
}

/**
 * Writes the descriptions in the default language, then translates them into the other survey languages.
 * @param {RunParams} params - Parameters.
 * @returns {Promise<RunResult>} The texts made, by node definition and language.
 */
const runDescriptions = async ({
  survey,
  rows,
  skippedCount,
  getModel,
  signal,
  onProgress,
  deps,
}: RunParams): Promise<RunResult> => {
  const [defaultLang, ...otherLangs] = getSurveyLanguages(survey)
  const phase = createPhasedProgress(
    [
      Math.ceil(rows.length / AiLimits.dataDictionaryBatchSize),
      ...otherLangs.map(() => Math.ceil(rows.length / TRANSLATION_BATCH_SIZE)),
    ],
    onProgress
  )
  const describeModel = await getModel('dataDictionary')
  const described = await runDataDictionaryDescriptions({
    items: { surveyName: Survey.getName(Survey.getSurveyInfo(survey)), nodeDefs: rows },
    ...describeModel,
    language: toLangLabel(defaultLang),
    signal,
    onProgress: phase(0),
    ...(deps.describe ? { describe: deps.describe } : {}),
  })
  const sources = Object.entries(described.aiDescriptions).map(([nodeDefUuid, text]) => ({
    nodeDefUuid,
    source: { lang: defaultLang, text },
  }))
  const translated = sources.map(({ nodeDefUuid, source }) => ({ nodeDefUuid, lang: defaultLang, aiText: source.text }))
  // an entry without a description in the default language gets none in the other languages either
  let failedCount = (described.failedCount + skippedCount) * (otherLangs.length + 1)
  let stop = described.stop
  for (const [index, lang] of otherLangs.entries()) {
    if (stop || sources.length === 0) break
    const translateModel = await getModel('translation')
    const result = await translateRowsToLang({
      rows: sources,
      toItem: ({ nodeDefUuid }) => ({ id: nodeDefUuid, kind: 'nodeDefDescription' }),
      lang,
      maxLength: AiLimits.translationItemMaxChars,
      ...translateModel,
      signal,
      onProgress: phase(index + 1),
      ...(deps.translate ? { translate: deps.translate } : {}),
    })
    translated.push(...result.translated.map(({ nodeDefUuid, aiText }) => ({ nodeDefUuid, lang, aiText })))
    failedCount += result.failedCount
    stop = result.stop
  }
  return { translated, failedCount, stop }
}

const KINDS: Record<SuggestionBatchKind, BatchKindDef> = {
  missingTranslations: {
    messageKeys: { start: 'start', summary: 'summary', done: 'done', failed: 'failed', nothing: 'nothing' },
    getLangLabel: (_survey, lang) => toLangLabel(lang),
    loadRows: async ({ survey, lang }) => buildMissingTextRows({ survey, lang }),
    run: async ({ getModel, deps, ...params }) => {
      const model = await getModel('translation')
      return runTranslateMissingTexts({ ...params, ...model, translate: deps.translate })
    },
    toDrafts: (survey, lang, translated: (MissingTextRow & { aiText: string })[]) =>
      toTextDrafts(
        survey,
        translated.map(({ nodeDefUuid, kind, aiText }) => ({ nodeDefUuid, kind, lang, aiText }))
      ),
  },
  categoryItemTranslations: {
    messageKeys: {
      start: 'categoryStart',
      summary: 'categorySummary',
      done: 'done',
      failed: 'failed',
      nothing: 'nothing',
    },
    getLangLabel: (_survey, lang) => toLangLabel(lang),
    loadRows: ({ survey, lang, scope, signal, deps }) =>
      loadCategoryLabelRows({
        surveyId: Number(Survey.getId(survey)),
        categories: toCategories(survey, scope.targetKeys),
        lang,
        languages: getSurveyLanguages(survey),
        signal,
        ...(deps.fetchPage ? { fetchPage: deps.fetchPage } : {}),
      }),
    run: async ({ getModel, deps, ...params }) => {
      const model = await getModel('translation')
      const { rows, failedCount, stop } = await runTranslateCategoryItemLabels({
        ...params,
        ...model,
        translate: deps.translate,
      })
      return { translated: rows, failedCount, stop }
    },
    // proposed over a missing label: one added during the run is a conflict at Apply
    toDrafts: (_survey, lang, translated) => toCategoryLabelDrafts(translated, lang),
  },
  newEntriesDescriptions: {
    messageKeys: {
      start: 'descriptionsStart',
      summary: 'descriptionsSummary',
      done: 'descriptionsDone',
      failed: 'descriptionsFailed',
      nothing: 'descriptionsNothing',
    },
    getLangLabel: (survey) => getSurveyLanguages(survey).map(toLangLabel).join(', '),
    loadRows: (params) => Promise.resolve(loadDescriptionRows(params)),
    run: runDescriptions,
    toDrafts: (survey, _lang, translated) =>
      toTextDrafts(
        survey,
        translated.map((text) => ({ ...text, kind: 'descriptions' as const }))
      ),
  },
}

/**
 * Returns the definition of a batch.
 * @param {SuggestionBatchKind} kind - Batch.
 * @returns {BatchKindDef} The definition.
 */
export const getAssistantBatchKind = (kind: SuggestionBatchKind): BatchKindDef => KINDS[kind]

/**
 * Loads the texts of a batch.
 * @param {object} params - Parameters.
 * @param {SuggestionBatchKind} params.kind - Batch.
 * @param {object} params.survey - Survey.
 * @param {SuggestionScope} params.scope - Language (key) and targets (none: all).
 * @param {AbortSignal} params.signal - Signal.
 * @param {AssistantBatchDeps} [params.deps] - Test dependencies.
 * @returns {Promise<object>} The rows and the number of texts that cannot be sent.
 */
export const loadAssistantBatch = ({
  kind,
  survey,
  scope,
  signal,
  deps = {},
}: {
  kind: SuggestionBatchKind
  survey: any
  scope: SuggestionScope
  signal: AbortSignal
  deps?: AssistantBatchDeps
}): Promise<{ rows: any[]; skippedCount: number }> =>
  KINDS[kind].loadRows({ survey, lang: scope.key ?? '', scope, signal, deps })

/**
 * Makes the texts of a batch with the provider of the conversation and returns their drafts.
 * @param {object} params - Parameters.
 * @param {SuggestionBatchKind} params.kind - Batch.
 * @param {Function} params.getSurvey - Survey as it is now (read again for the drafts).
 * @param {string} params.lang - Language (translations).
 * @param {object[]} params.rows - Rows of loadAssistantBatch.
 * @param {number} params.skippedCount - Texts that cannot be sent (counted as failed).
 * @param {string} [params.providerId] - Provider of the conversation.
 * @param {AbortSignal} params.signal - Signal.
 * @param {Function} params.onProgress - Requests done and total, with the estimated time left.
 * @param {Function} [params.resolveBatch] - Resolves the model of a feature (tests).
 * @param {AssistantBatchDeps} [params.deps] - Test dependencies.
 * @returns {Promise<object>} The drafts, the texts not made and why the run ended early.
 */
export const runAssistantBatch = async ({
  kind,
  getSurvey,
  lang,
  rows,
  skippedCount,
  providerId,
  signal,
  onProgress,
  resolveBatch = resolveBatchModel,
  deps = {},
}: {
  kind: SuggestionBatchKind
  getSurvey: () => any
  lang: string
  rows: any[]
  skippedCount: number
  providerId?: string
  signal: AbortSignal
  onProgress: (progress: SuggestionBatchProgress) => void
  resolveBatch?: typeof resolveBatchModel
  deps?: AssistantBatchDeps
}): Promise<{ drafts: ChangeOperationDraft[]; failedCount: number; stop?: AiBatchStop }> => {
  const survey = getSurvey()
  const surveyId = Number(Survey.getId(survey))
  const models = new Map<AiFeatureKey, Promise<AiBatchModel>>()
  const getModel = (feature: AiFeatureKey): Promise<AiBatchModel> => {
    if (!models.has(feature)) models.set(feature, resolveBatch({ feature, surveyId, providerId, signal }))
    return models.get(feature) as Promise<AiBatchModel>
  }
  // timed from the first request: a consent dialog before it is not part of the estimate
  let startedAt: number | null = null
  const { translated, failedCount, stop } = await KINDS[kind].run({
    survey,
    rows,
    lang,
    skippedCount,
    getModel,
    signal,
    onProgress: (progress) => {
      startedAt ??= Date.now()
      onProgress(withRemainingTime(progress, Date.now() - startedAt))
    },
    deps,
  })
  return { drafts: KINDS[kind].toDrafts(getSurvey(), lang, translated), failedCount, stop }
}
