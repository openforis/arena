/**
 * The turn of a Do it run as a batch (getSuggestionBatchKind), without the model's tools: it says the texts are
 * translated in batches, shows the progress under its tool row, then proposes every translation on one change set
 * card. The calls use the conversation's provider, with the policy of the translation feature.
 */
import { getLanguageLabel } from '@core/app/languages'
import * as Category from '@core/survey/category'
import * as Survey from '@core/survey/survey'
import { uuidv4 } from '@core/uuid'

import type { FetchMissingLabelsPage } from '@webapp/ai/changeSets/categoryItemLabels/categoryItemLabelsApi'
import { getLabelValue } from '@webapp/ai/changeSets/operations'
import type { TranslationSource } from '@webapp/ai/changeSets/translationSource'
import type { ChangeOperationDraft } from '@webapp/ai/changeSets/types'
import type { Conversation } from '@webapp/ai/conversations/types'
import { logAiWarning } from '@webapp/ai/log/aiLog'
import { getAiErrorKey, getAiErrorParams, isAiAbortError } from '@webapp/ai/runtime/runtimeErrors'
import {
  SUGGESTION_BATCH_TOOL_NAMES,
  withRemainingTime,
  type SuggestionBatchKind,
} from '@webapp/ai/suggestions/suggestionBatchTurn'
import type { SuggestionScope } from '@webapp/ai/suggestions/types'
import { getSurveyLanguages } from '@webapp/ai/tools/design/missingTexts'
import { proposeChangeSet } from '@webapp/ai/tools/design/proposeChangeSet'
import { AiToolFailure } from '@webapp/ai/tools/toolFailure'
import type { AiToolContext } from '@webapp/ai/tools/types'
import { resolveBatchModel } from '@webapp/ai/workflows/batchModel'
import type { AiBatchGuard, AiBatchProgress, AiBatchStop } from '@webapp/ai/workflows/batchRun'
import { TRANSLATION_BATCH_SIZE } from '@webapp/ai/workflows/translateAllLabels'
import {
  loadCategoryLabelRows,
  runTranslateCategoryItemLabels,
  toCategoryLabelDrafts,
} from '@webapp/ai/workflows/translateCategoryItemLabels'
import {
  buildMissingTextRows,
  runTranslateMissingTexts,
  type MissingTextRow,
} from '@webapp/ai/workflows/translateMissingTexts'
import type { AiGenerateText } from '@common/ai/llm'
import type { translateItems } from '@common/ai/tasks/translation'

import { PROVIDER_ERROR_KEY, type RunAssistantTurnParams } from './runAssistantTurn'
import { createTurnState, type TurnState } from './turnState'

const KEYS = 'aiAssistant.missingTextsBatch'

type Row = { source: TranslationSource }
type TranslatedRow = Row & { aiText: string }

// injected by tests
type BatchDeps = { translate?: typeof translateItems; fetchPage?: FetchMissingLabelsPage }

type LoadParams = { survey: any; lang: string; scope: SuggestionScope; signal: AbortSignal; deps: BatchDeps }

type TranslateParams = {
  rows: any[]
  lang: string
  skippedCount: number
  generateText: AiGenerateText
  guard: AiBatchGuard
  signal: AbortSignal
  onProgress: (progress: AiBatchProgress) => void
  translate?: typeof translateItems
}

type BatchKind = {
  startKey: string
  summaryKey: string
  // the texts to translate, and the number of source texts too long to send
  loadRows: (params: LoadParams) => Promise<{ rows: Row[]; skippedCount: number }>
  translate: (
    params: TranslateParams
  ) => Promise<{ translated: TranslatedRow[]; failedCount: number; stop?: AiBatchStop }>
  toDrafts: (survey: any, lang: string, translated: any[]) => ChangeOperationDraft[]
}

/**
 * Builds the label drafts of the translated texts: a text filled or a node definition deleted during the run is left
 * out.
 * @param {object} survey - Survey as it is now.
 * @param {string} lang - Target language.
 * @param {object[]} translated - Translated rows.
 * @returns {ChangeOperationDraft[]} The drafts.
 */
const toTextDrafts = (survey: any, lang: string, translated: (MissingTextRow & { aiText: string })[]) => {
  const drafts: ChangeOperationDraft[] = []
  for (const { nodeDefUuid, kind, aiText } of translated) {
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    if (nodeDef && !getLabelValue(nodeDef, kind, lang)) {
      drafts.push({ type: 'label.set', nodeDefUuid, kind, lang, from: null, to: aiText })
    }
  }
  return drafts
}

/**
 * Returns the categories of the suggestion (its targets) that still exist.
 * @param {object} survey - Survey.
 * @param {string[]} uuids - Category uuids.
 * @returns {object[]} The categories, with their names.
 */
const toCategories = (survey: any, uuids: string[]) =>
  uuids.flatMap((uuid) => {
    const category = Survey.getCategoryByUuid(uuid)(survey)
    return category ? [{ uuid, name: Category.getName(category) }] : []
  })

const BATCH_KINDS: Record<SuggestionBatchKind, BatchKind> = {
  missingTranslations: {
    startKey: `${KEYS}.start`,
    summaryKey: `${KEYS}.summary`,
    loadRows: async ({ survey, lang }) => buildMissingTextRows({ survey, lang }),
    translate: runTranslateMissingTexts,
    toDrafts: toTextDrafts,
  },
  categoryItemTranslations: {
    startKey: `${KEYS}.categoryStart`,
    summaryKey: `${KEYS}.categorySummary`,
    loadRows: ({ survey, lang, scope, signal, deps }) =>
      loadCategoryLabelRows({
        surveyId: Number(Survey.getId(survey)),
        categories: toCategories(survey, scope.targetKeys),
        lang,
        languages: getSurveyLanguages(survey),
        signal,
        ...(deps.fetchPage ? { fetchPage: deps.fetchPage } : {}),
      }),
    translate: async (params) => {
      const { rows, failedCount, stop } = await runTranslateCategoryItemLabels(params)
      return { translated: rows, failedCount, stop }
    },
    // proposed over a missing label: one added during the run is a conflict at Apply
    toDrafts: (_survey, lang, translated) => toCategoryLabelDrafts(translated, lang),
  },
}

/**
 * Proposes the translations on one card under the tool row.
 * @param {object} params - Parameters.
 * @param {TurnState} params.state - Turn state.
 * @param {AiToolContext} params.ctx - Tool context.
 * @param {string} params.toolCallId - Tool row.
 * @param {ChangeOperationDraft[]} params.drafts - Drafts.
 * @param {string} params.summary - Summary of the card.
 * @returns {Promise<void>} Resolves when the card is added.
 */
const proposeTranslations = async ({
  state,
  ctx,
  toolCallId,
  drafts,
  summary,
}: {
  state: TurnState
  ctx: AiToolContext
  toolCallId: string
  drafts: ChangeOperationDraft[]
  summary: string
}): Promise<void> => {
  if (drafts.length === 0) {
    state.endTool({ toolCallId, output: { error: { code: 'noTranslation', message: 'No text was translated.' } } })
    return
  }
  const onChangeSet: AiToolContext['onChangeSet'] = (changeSet) => {
    state.addChangeSet(changeSet)
    ctx.onChangeSet(changeSet)
  }
  const survey = ctx.getSurvey?.() ?? ctx.survey
  const output = await proposeChangeSet({ ctx: { ...ctx, survey, onChangeSet }, drafts, summary })
  state.endTool({ toolCallId, output })
}

/**
 * Ends the turn: stopped by the user, failed (the texts translated before the failure are still on the card), or done.
 * @param {TurnState} state - Turn state.
 * @param {AiBatchStop} [stop] - Why the run ended early.
 * @param {AbortSignal} signal - Turn signal.
 * @returns {void}
 */
const finishBatch = (state: TurnState, stop: AiBatchStop | undefined, signal: AbortSignal): void => {
  if (signal.aborted || stop?.cause === 'cancelled') state.finish('stopped')
  else if (stop?.cause === 'error') {
    state.finish('error', getAiErrorKey(stop.error) ?? PROVIDER_ERROR_KEY, getAiErrorParams(stop.error))
  } else state.finish('done')
}

/**
 * Ends a turn that threw: stopped, or failed with the error of the AI request (the provider error otherwise).
 * @param {object} params - Parameters.
 * @param {TurnState} params.state - Turn state.
 * @param {string} params.toolCallId - Tool row (failed, when it was started).
 * @param {unknown} params.error - Error.
 * @param {AbortSignal} params.signal - Turn signal.
 * @returns {void}
 */
const failBatch = ({
  state,
  toolCallId,
  error,
  signal,
}: {
  state: TurnState
  toolCallId: string
  error: unknown
  signal: AbortSignal
}): void => {
  const code = error instanceof AiToolFailure ? error.code : 'toolFailed'
  state.endTool({ toolCallId, output: { error: { code, message: String(error) } } })
  if (signal.aborted || isAiAbortError(error)) {
    state.finish('stopped')
    return
  }
  const errorKey = getAiErrorKey(error)
  if (!errorKey) logAiWarning('The suggestion batch failed', error)
  state.finish('error', errorKey ?? PROVIDER_ERROR_KEY, getAiErrorParams(error))
}

/**
 * Runs the batch turn of a Do it. Like runAssistantTurn, it never throws: a failure ends the answer with status
 * "error".
 * @param {object} params - The turn parameters of runAssistantTurn (model, tools and limits unused).
 * @param {SuggestionBatchKind} params.kind - The batch.
 * @returns {Promise<Conversation>} The final conversation.
 */
export const runSuggestionBatchTurn = async ({
  kind,
  conversation,
  userMessage,
  displayText,
  ctx,
  onUpdate,
  signal,
  resolveBatch = resolveBatchModel,
  ...deps
}: Pick<RunAssistantTurnParams, 'conversation' | 'userMessage' | 'displayText' | 'ctx' | 'onUpdate' | 'signal'> &
  BatchDeps & { kind: SuggestionBatchKind; resolveBatch?: typeof resolveBatchModel }): Promise<Conversation> => {
  const state = createTurnState({ conversation, userMessage, displayText, onUpdate })
  const batch = BATCH_KINDS[kind]
  const scope = conversation.suggestionScope as SuggestionScope
  const lang = scope.key ?? ''
  const langLabel = getLanguageLabel(lang) || lang
  const toolCallId = uuidv4()
  try {
    const survey = ctx.getSurvey?.() ?? ctx.survey
    const { rows, skippedCount } = await batch.loadRows({ survey, lang, scope, signal, deps })
    if (rows.length === 0) {
      state.appendText(ctx.t(`${KEYS}.nothing`))
      state.finish(signal.aborted ? 'stopped' : 'done')
      return state.get()
    }
    state.appendText(ctx.t(batch.startKey, { count: rows.length, lang: langLabel, size: TRANSLATION_BATCH_SIZE }))
    const toolName = SUGGESTION_BATCH_TOOL_NAMES[kind]
    state.startTool({ toolCallId, toolName, input: { name: langLabel, count: rows.length } })
    const surveyId = Number(Survey.getId(survey))
    const { providerId } = conversation
    const { generateText, guard } = await resolveBatch({ feature: 'translation', surveyId, providerId, signal })
    const startedAt = Date.now()
    const { translated, failedCount, stop } = await batch.translate({
      rows,
      lang,
      skippedCount,
      generateText,
      guard,
      signal,
      onProgress: (progress) =>
        state.setToolOutput({ toolCallId, output: withRemainingTime(progress, Date.now() - startedAt) }),
      translate: deps.translate,
    })
    const drafts = batch.toDrafts(ctx.getSurvey?.() ?? ctx.survey, lang, translated)
    await proposeTranslations({ state, ctx, toolCallId, drafts, summary: ctx.t(batch.summaryKey, { lang: langLabel }) })
    const notes = [
      drafts.length > 0 ? ctx.t(`${KEYS}.done`, { count: drafts.length }) : '',
      failedCount > 0 ? ctx.t(`${KEYS}.failed`, { count: failedCount }) : '',
    ].filter(Boolean)
    if (notes.length > 0) state.appendText(notes.join(' '))
    finishBatch(state, stop, signal)
  } catch (error) {
    failBatch({ state, toolCallId, error, signal })
  }
  return state.get()
}
