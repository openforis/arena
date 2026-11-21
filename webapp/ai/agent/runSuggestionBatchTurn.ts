/**
 * The turn of a Do it run as a batch (getSuggestionBatchKind), without the model's tools: it says the texts are made in
 * batches, shows the progress card under its tool row, then proposes every text on one change set card. The requests
 * use the conversation's provider (workflows/assistantBatches).
 */
import { uuidv4 } from '@core/uuid'

import type { ChangeOperationDraft } from '@webapp/ai/changeSets/types'
import type { Conversation } from '@webapp/ai/conversations/types'
import { logAiWarning } from '@webapp/ai/log/aiLog'
import { getAiErrorKey, getAiErrorParams, isAiAbortError } from '@webapp/ai/runtime/runtimeErrors'
import { SUGGESTION_BATCH_TOOL_NAMES, type SuggestionBatchKind } from '@webapp/ai/suggestions/suggestionBatchTurn'
import type { SuggestionScope } from '@webapp/ai/suggestions/types'
import { proposeChangeSet } from '@webapp/ai/tools/design/proposeChangeSet'
import { AiToolFailure } from '@webapp/ai/tools/toolFailure'
import type { AiToolContext } from '@webapp/ai/tools/types'
import {
  getAssistantBatchKind,
  loadAssistantBatch,
  runAssistantBatch,
  type AssistantBatchDeps,
} from '@webapp/ai/workflows/assistantBatches'
import type { resolveBatchModel } from '@webapp/ai/workflows/batchModel'
import type { AiBatchStop } from '@webapp/ai/workflows/batchRun'
import { TRANSLATION_BATCH_SIZE } from '@webapp/ai/workflows/translateAllLabels'

import { getThrownMessage, PROVIDER_ERROR_KEY, type RunAssistantTurnParams } from './runAssistantTurn'
import { createTurnState, type TurnState } from './turnState'

const KEYS = 'aiAssistant.missingTextsBatch'

/**
 * Proposes the texts on one card under the tool row.
 * @param {object} params - Parameters.
 * @param {TurnState} params.state - Turn state.
 * @param {AiToolContext} params.ctx - Tool context.
 * @param {string} params.toolCallId - Tool row.
 * @param {ChangeOperationDraft[]} params.drafts - Drafts.
 * @param {string} params.summary - Summary of the card.
 * @returns {Promise<void>} Resolves when the card is added.
 */
const proposeTexts = async ({
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
    state.endTool({ toolCallId, output: { error: { code: 'noTranslation', message: 'No text was made.' } } })
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
 * Ends the turn: stopped by the user, failed (the texts made before the failure are still on the card), or done.
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
  state.endTool({ toolCallId, output: { error: { code, message: getThrownMessage(error) } } })
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
  resolveBatch,
  ...deps
}: Pick<RunAssistantTurnParams, 'conversation' | 'userMessage' | 'displayText' | 'ctx' | 'onUpdate' | 'signal'> &
  AssistantBatchDeps & {
    kind: SuggestionBatchKind
    resolveBatch?: typeof resolveBatchModel
  }): Promise<Conversation> => {
  const state = createTurnState({ conversation, userMessage, displayText, onUpdate })
  const { messageKeys, getLangLabel } = getAssistantBatchKind(kind)
  const scope = conversation.suggestionScope as SuggestionScope
  const lang = scope.key ?? ''
  const getSurvey = () => ctx.getSurvey?.() ?? ctx.survey
  const toolCallId = uuidv4()
  try {
    const survey = getSurvey()
    const langLabel = getLangLabel(survey, lang)
    const { rows, skippedCount } = await loadAssistantBatch({ kind, survey, scope, signal, deps })
    if (rows.length === 0) {
      state.appendText(ctx.t(`${KEYS}.${messageKeys.nothing}`))
      state.finish(signal.aborted ? 'stopped' : 'done')
      return state.get()
    }
    const count = rows.length
    state.appendText(ctx.t(`${KEYS}.${messageKeys.start}`, { count, lang: langLabel, size: TRANSLATION_BATCH_SIZE }))
    state.startTool({ toolCallId, toolName: SUGGESTION_BATCH_TOOL_NAMES[kind], input: { name: langLabel, count } })
    const { drafts, failedCount, stop } = await runAssistantBatch({
      kind,
      getSurvey,
      lang,
      rows,
      skippedCount,
      providerId: conversation.providerId,
      signal,
      onProgress: (progress) => state.setToolOutput({ toolCallId, output: progress }),
      resolveBatch,
      deps,
    })
    const summary = ctx.t(`${KEYS}.${messageKeys.summary}`, { lang: langLabel })
    await proposeTexts({ state, ctx, toolCallId, drafts, summary })
    const notes = [
      drafts.length > 0 ? ctx.t(`${KEYS}.${messageKeys.done}`, { count: drafts.length }) : '',
      failedCount > 0 ? ctx.t(`${KEYS}.${messageKeys.failed}`, { count: failedCount }) : '',
    ].filter(Boolean)
    if (notes.length > 0) state.appendText(notes.join(' '))
    finishBatch(state, stop, signal)
  } catch (error) {
    failBatch({ state, toolCallId, error, signal })
  }
  return state.get()
}
