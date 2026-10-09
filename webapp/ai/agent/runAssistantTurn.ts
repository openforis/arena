/**
 * One assistant turn: system prompt, history, tools, then the AI SDK tool loop streamed into the conversation.
 */
import { stepCountIs, streamText, type LanguageModel } from 'ai'

import * as Survey from '@core/survey/survey'

import type { AiFeatureKey } from '@common/ai/features'
import { AiLimits } from '@common/ai/limits'
import type { AiHostingClass, AiPolicy } from '@common/ai/policy'

import { isDataToolResult } from '@webapp/ai/conversations/dataClass'
import type { Conversation } from '@webapp/ai/conversations/types'
import { getHandbookOutline } from '@webapp/ai/help/handbookSearch'
import { loadHandbook } from '@webapp/ai/help/loadHandbook'
import { resolveAssistantEngine } from '@webapp/ai/engines/assistantEngine'
import { resolveModel, type ResolveModelParams, type ResolvedModel } from '@webapp/ai/engines/resolveModel'
import type { AiSelectedEngine } from '@webapp/ai/engines/types'
import { getAiErrorKey, isAiAbortError } from '@webapp/ai/runtime/runtimeErrors'
import { getTools, toAiSdkTools } from '@webapp/ai/tools/registry'
import type { AiTool, AiToolContext } from '@webapp/ai/tools/types'

import { buildHistory, getHistoryBudget } from './agentMessages'
import { buildAssistantSystemPrompt, type AssistantPromptArea } from './assistantSystemPrompt'
import { resolveAssistantTurnModel } from './turnModel'
import { createTurnState, type TurnState } from './turnState'

export type AssistantLimits = { maxPromptChars: number; maxSteps: number }

// the browser doesn't know the server's AI_MAX_PROMPT_CHARS: its default is the budget (C: per-engine limits)
export const DEFAULT_ASSISTANT_LIMITS: AssistantLimits = {
  maxPromptChars: AiLimits.assistantDefaultMaxPromptChars,
  maxSteps: AiLimits.assistantMaxSteps,
}

// gateway feature of each area (D2 adds analysis, D3 cleaning)
export const assistantAreaFeatures: Record<AssistantPromptArea, AiFeatureKey> = {
  design: 'assistantDesign',
  help: 'chatbot',
  analysis: 'assistantAnalysis',
}

const PROVIDER_ERROR_KEY = 'aiProviderUnavailable'

export type RunAssistantTurnParams = {
  conversation: Conversation
  userMessage: string
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

type StreamOutcome = { aborted: boolean; error: unknown }

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
    case 'tool-call':
      state.startTool({ toolCallId: part.toolCallId, toolName: part.toolName, input: part.input })
      break
    case 'tool-result':
      state.endTool({ toolCallId: part.toolCallId, output: part.output })
      break
    case 'tool-error':
      state.endTool({ toolCallId: part.toolCallId, output: toolFailedOutput(part.error) })
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
  const state = createTurnState({ conversation, userMessage, onUpdate })
  const turnCtx: AiToolContext = {
    ...ctx,
    signal,
    onChangeSet: (changeSet) => {
      state.addChangeSet(changeSet)
      ctx.onChangeSet(changeSet)
    },
  }
  const outcome: StreamOutcome = { aborted: false, error: null }
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
      })
    const budgetChars = getHistoryBudget({
      maxPromptChars: turn.limits.maxPromptChars,
      systemPrompt: system,
      tools: toolList,
    })
    const result = streamText({
      model: turn.model,
      system,
      messages: buildHistory({ messages: conversation.messages, userMessage, budgetChars }),
      tools: toolList.length > 0 ? toAiSdkTools(toolList, turnCtx) : undefined,
      stopWhen: stepCountIs(turn.limits.maxSteps),
      abortSignal: signal,
      maxRetries: 0,
      // errors arrive as 'error' parts of the full stream
      onError: () => undefined,
    })
    for await (const part of result.fullStream) {
      handleStreamPart(part, state, outcome)
      if (part.type === 'tool-result') {
        const tool = toolList.find((candidate) => candidate.name === part.toolName)
        // saved with the tool result: a turn stopped after a data result keeps the class
        if (tool && isDataToolResult({ tool, output: part.output })) state.escalateDataClass(tool.dataClass)
      }
    }
  } catch (error) {
    outcome.error = error
  }
  finishTurn(state, outcome, signal)
  return state.get()
}
