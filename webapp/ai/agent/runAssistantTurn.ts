/**
 * One assistant turn: system prompt, history, tools, then the AI SDK tool loop streamed into the conversation.
 */
import { stepCountIs, streamText, type LanguageModel } from 'ai'

import * as Survey from '@core/survey/survey'

import type { AiFeatureKey } from '@common/ai/features'
import { AiLimits } from '@common/ai/limits'
import type { AiHostingClass, AiPolicy } from '@common/ai/policy'
import { CONVERSATION_TITLE_TOOL_NAME } from '@common/ai/prompts/assistantConversationTitle'

import { isDataToolResult } from '@webapp/ai/conversations/dataClass'
import { getPendingChangeSets } from '@webapp/ai/conversations/pendingChangeSets'
import { createAnalysisQueryStore } from '@webapp/ai/tools/analysis/queryStore'
import type { Conversation } from '@webapp/ai/conversations/types'
import { getHandbookOutline } from '@webapp/ai/help/handbookSearch'
import { loadHandbook } from '@webapp/ai/help/loadHandbook'
import { resolveAssistantEngine } from '@webapp/ai/engines/assistantEngine'
import { resolveModel, type ResolveModelParams, type ResolvedModel } from '@webapp/ai/engines/resolveModel'
import type { AiSelectedEngine } from '@webapp/ai/engines/types'
import { getAiErrorKey, isAiAbortError } from '@webapp/ai/runtime/runtimeErrors'
import { getTools, toAiSdkTools } from '@webapp/ai/tools/registry'
import { categoryItemRefsRegistry } from '@webapp/ai/tools/design/categoryItemRefs'
import type { AiTool, AiToolContext } from '@webapp/ai/tools/types'

import { buildTrimmedHistory, getHistoryBudget } from './agentMessages'
import { buildAssistantSystemPrompt, type AssistantPromptArea } from './assistantSystemPrompt'
import { resolveAssistantTurnModel } from './turnModel'
import { createTurnState, type TurnState } from './turnState'
import { buildTurnUsage, estimateContextTokens, toContextTokens, type TurnUsageInputs } from './turnUsage'

export type AssistantLimits = { maxPromptChars: number; maxSteps: number }

// the browser doesn't know the server's AI_MAX_PROMPT_CHARS: its default is the budget (C: per-engine limits)
export const DEFAULT_ASSISTANT_LIMITS: AssistantLimits = {
  maxPromptChars: AiLimits.assistantDefaultMaxPromptChars,
  maxSteps: AiLimits.assistantMaxSteps,
}

// gateway feature of each area (design, help, analysis, cleaning)
export const assistantAreaFeatures: Record<AssistantPromptArea, AiFeatureKey> = {
  design: 'assistantDesign',
  help: 'chatbot',
  analysis: 'assistantAnalysis',
  cleaning: 'assistantCleaning',
}

const PROVIDER_ERROR_KEY = 'aiProviderUnavailable'

export type RunAssistantTurnParams = {
  conversation: Conversation
  userMessage: string
  // what the chat shows instead of the user message (the model still gets userMessage)
  displayText?: string
  area: AssistantPromptArea
  ctx: AiToolContext
  access: { effective: AiPolicy | null; hostingClass: AiHostingClass | null }
  onUpdate: (conversation: Conversation) => void
  signal: AbortSignal
  model?: LanguageModel
  limits?: AssistantLimits
  systemPrompt?: string
  tools?: AiTool[]
  // called once per turn with the selected engine (not when `model` is given)
  onEngine?: (engine: AiSelectedEngine) => void
  // engine resolver (injected by tests)
  resolve?: (params: ResolveModelParams) => Promise<ResolvedModel>
}

/**
 * Loads the handbook outline for the Help prompt (null when the handbook can't be loaded: the turn still runs).
 * @returns {Promise<string|null>} The outline.
 */
const loadOutline = async (): Promise<string | null> => {
  try {
    const { handbook } = await loadHandbook()
    return getHandbookOutline(handbook, AiLimits.handbookOutlineMaxChars)
  } catch {
    return null
  }
}

/**
 * Builds the structured result of a tool that threw outside the wrapper.
 * @param {unknown} error - The error.
 * @returns {object} The `{ error: { code, message } }` result.
 */
const toolFailedOutput = (error: unknown) => ({
  error: { code: 'toolFailed', message: error instanceof Error ? error.message : String(error) },
})

type StreamOutcome = {
  aborted: boolean
  error: unknown
  // tokens reported by the last finish-step (null: not reported)
  stepTokens: number | null
  // set once the request is built: from then on the answer gets a usage
  sent: TurnUsageInputs | null
}

/**
 * Applies one stream part to the turn state.
 * @param {any} part - Full-stream part.
 * @param {TurnState} state - Turn state.
 * @param {StreamOutcome} outcome - Abort / error seen so far (updated).
 * @returns {void}
 */
const handleStreamPart = (part: any, state: TurnState, outcome: StreamOutcome): void => {
  switch (part.type) {
    case 'text-delta':
      state.appendText(part.text)
      break
    case 'reasoning-delta':
      state.appendReasoning(part.text)
      break
    case 'tool-call':
      state.startTool({ toolCallId: part.toolCallId, toolName: part.toolName, input: part.input })
      break
    case 'tool-result':
      state.endTool({ toolCallId: part.toolCallId, output: part.output })
      break
    case 'tool-error':
      state.endTool({ toolCallId: part.toolCallId, output: toolFailedOutput(part.error) })
      break
    case 'finish-step':
      // the last step is what the model held at the end of the turn
      outcome.stepTokens = toContextTokens(part.usage)
      break
    case 'abort':
      outcome.aborted = true
      break
    case 'error':
      outcome.error = part.error
      break
    default:
      break
  }
}

/**
 * Escalates the conversation's data class when a tool result carries data.
 * @param {object} params - Parameters.
 * @param {any} params.part - Stream part.
 * @param {AiTool[]} params.toolList - Tools offered in the turn.
 * @param {TurnState} params.state - Turn state.
 * @returns {void}
 */
const escalateOnDataResult = ({ part, toolList, state }: { part: any; toolList: AiTool[]; state: TurnState }): void => {
  if (part.type !== 'tool-result') return
  const tool = toolList.find((candidate) => candidate.name === part.toolName)
  // saved with the tool result: a turn stopped after a data result keeps the class
  if (tool && isDataToolResult({ tool, output: part.output })) state.escalateDataClass(tool.dataClass)
}

/**
 * Ends the turn from what the stream reported.
 * @param {TurnState} state - Turn state.
 * @param {StreamOutcome} outcome - Abort / error.
 * @param {AbortSignal} signal - Turn signal.
 * @returns {void}
 */
const finishTurn = (state: TurnState, outcome: StreamOutcome, signal: AbortSignal): void => {
  if (outcome.aborted || signal.aborted || isAiAbortError(outcome.error)) state.finish('stopped')
  else if (outcome.error) state.finish('error', getAiErrorKey(outcome.error) ?? PROVIDER_ERROR_KEY)
  else state.finish('done')
}

/**
 * Runs one assistant turn. The conversation is reported through onUpdate on every change; the final one is returned.
 * Errors never throw: they end the turn with status "error" (or "stopped" on abort).
 * Without a `model`, the engine is selected for the conversation's data class: its model, limits and hosting class.
 * @param {RunAssistantTurnParams} params - Parameters.
 * @returns {Promise<Conversation>} The conversation after the turn.
 */
export const runAssistantTurn = async ({
  conversation,
  userMessage,
  displayText,
  area,
  ctx,
  access,
  onUpdate,
  signal,
  model,
  limits,
  systemPrompt,
  tools,
  onEngine,
  resolve = resolveModel,
}: RunAssistantTurnParams): Promise<Conversation> => {
  const state = createTurnState({ conversation, userMessage, displayText, onUpdate })
  const turnCtx: AiToolContext = {
    ...ctx,
    signal,
    // queries proposed in this turn are saved through the turn state, with the messages (ids continue: q3 after q2)
    analysisQueries: createAnalysisQueryStore({ queries: conversation.queries ?? {}, onChange: state.setQueries }),
    // a Do it conversation keeps its scope for every turn; the pending cards include the ones of this turn
    suggestionScope: conversation.suggestionScope ?? null,
    getPendingChangeSets: () => getPendingChangeSets(state.get()),
    // kept across the turns of the conversation, so "continue" can propose items listed in an earlier turn
    categoryItemRefs:
      ctx.categoryItemRefs ??
      (area === 'design' ? categoryItemRefsRegistry.forConversation(conversation.id) : undefined),
    onChangeSet: (changeSet) => {
      state.addChangeSet(changeSet)
      ctx.onChangeSet(changeSet)
    },
    // the model names the conversation on its first message (the later turns keep the title)
    setConversationTitle: conversation.messages.length === 0 ? state.setTitle : undefined,
  }
  const outcome: StreamOutcome = { aborted: false, error: null, stepTokens: null, sent: null }
  try {
    const feature = assistantAreaFeatures[area]
    // Help sends no survey content and no surveyId (deviation 9)
    const surveyId = area !== 'help' && ctx.survey ? Survey.getId(ctx.survey) : undefined
    const turn = await resolveAssistantEngine({
      model,
      limits,
      defaultLimits: DEFAULT_ASSISTANT_LIMITS,
      access,
      feature,
      surveyId,
      // the conversation's class ('schema' for the assistant)
      dataClass: conversation.dataClass,
      signal,
      // D2: declare data when the selected engine is offered a data tool (wraps the injected resolver)
      resolve: (params) =>
        resolveAssistantTurnModel({
          params,
          getToolsForHosting: (hostingClass) =>
            getTools({ area, ctx: turnCtx, effective: access.effective, hostingClass, tools }),
          resolve,
        }),
    })
    if (turn.engine) onEngine?.(turn.engine)
    const toolList = getTools({
      area,
      ctx: turnCtx,
      effective: turn.access.effective,
      hostingClass: turn.access.hostingClass,
      tools,
    })
    const outline = area === 'help' && !systemPrompt ? await loadOutline() : null
    const system =
      systemPrompt ??
      buildAssistantSystemPrompt({
        area,
        ctx: turnCtx,
        outline,
        dataToolsAvailable: toolList.some((tool) => tool.dataClass === 'data'),
        titleToolAvailable: toolList.some((tool) => tool.name === CONVERSATION_TITLE_TOOL_NAME),
      })
    const budgetChars = getHistoryBudget({
      maxPromptChars: turn.limits.maxPromptChars,
      systemPrompt: system,
      tools: toolList,
    })
    const history = buildTrimmedHistory({ messages: conversation.messages, userMessage, budgetChars })
    outcome.sent = {
      estimatedTokens: estimateContextTokens({ systemPrompt: system, tools: toolList, messages: history.messages }),
      droppedCount: history.droppedCount,
      contextWindow: turn.engine?.contextWindow ?? null,
    }
    const result = streamText({
      model: turn.model,
      system,
      messages: history.messages,
      tools: toolList.length > 0 ? toAiSdkTools(toolList, turnCtx) : undefined,
      stopWhen: stepCountIs(turn.limits.maxSteps),
      abortSignal: signal,
      maxRetries: 0,
      // errors arrive as 'error' parts of the full stream
      onError: () => undefined,
    })
    for await (const part of result.fullStream) {
      handleStreamPart(part, state, outcome)
      escalateOnDataResult({ part, toolList, state })
    }
  } catch (error) {
    outcome.error = error
  }
  // also on a stopped or failed answer: the meter then shows how full the context was
  if (outcome.sent) state.setUsage(buildTurnUsage({ stepTokens: outcome.stepTokens, ...outcome.sent }))
  finishTurn(state, outcome, signal)
  return state.get()
}
