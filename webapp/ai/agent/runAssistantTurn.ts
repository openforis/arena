/**
 * One assistant turn: system prompt, history, tools, then the AI SDK tool loop streamed into the conversation.
 */
import {
  ToolChoiceViolationError,
  streamText,
  type LanguageModel,
  type ModelMessage,
  type TextStreamPart,
  type ToolSet,
} from 'ai'

import * as Survey from '@core/survey/survey'

import type { AiFeatureKey } from '@common/ai/features'
import { AiLimits } from '@common/ai/limits'
import type { AiPolicy } from '@common/ai/policy'
import { CONVERSATION_TITLE_TOOL_NAME } from '@common/ai/prompts/assistantConversationTitle'
import { isWireObject } from '@common/ai/wire'

import { getConversationDataClass, isDataToolResult } from '@webapp/ai/conversations/dataClass'
import { getPendingChangeSets } from '@webapp/ai/conversations/pendingChangeSets'
import { isDeepEqual } from '@webapp/ai/changeSets/deepEqual'
import { MAP_PROPOSE_LAYER_TOOL_NAME, getProposedMapLayer } from '@webapp/ai/tools/analysis/proposeMapLayer'
import { createAnalysisQueryStore } from '@webapp/ai/tools/analysis/queryStore'
import type { Conversation } from '@webapp/ai/conversations/types'
import { getHandbookOutline } from '@webapp/ai/help/handbookSearch'
import { loadHandbook } from '@webapp/ai/help/loadHandbook'
import { resolveAssistantEngine } from '@webapp/ai/engines/assistantEngine'
import { CHARS_PER_TOKEN } from '@webapp/ai/engines/localServerProbe'
import type { AiEngineLimits } from '@webapp/ai/engines/types'
import { resolveModel, type ResolveModelParams, type ResolvedModel } from '@webapp/ai/engines/resolveModel'
import { getAiErrorKey, getAiErrorParams, isAiAbortError } from '@webapp/ai/runtime/runtimeErrors'
import { getToolResultCap } from '@webapp/ai/tools/common/toolResult'
import { getTools, toAiSdkTools } from '@webapp/ai/tools/registry'
import { categoryItemRefsRegistry } from '@webapp/ai/tools/design/categoryItemRefs'
import type { AiTool, AiToolContext } from '@webapp/ai/tools/types'

import { APPLY_NOTE_PREFIX, buildTrimmedHistory, getHistoryBudget, getToolDefinitionChars } from './agentMessages'
import { buildAssistantSystemPrompt, type AssistantPromptArea } from './assistantSystemPrompt'
import { resolveAssistantTurnModel } from './turnModel'
import { createTurnState, type TurnState } from './turnState'
import { buildTurnUsage, estimateContextTokens, toContextTokens, type TurnUsageInputs } from './turnUsage'

export type AssistantLimits = AiEngineLimits

// the browser doesn't know the server's AI_MAX_PROMPT_CHARS: its default is the budget (C: per-engine limits)
export const DEFAULT_ASSISTANT_LIMITS: AssistantLimits = {
  maxPromptChars: AiLimits.assistantDefaultMaxPromptChars,
}

// gateway feature of each area (design, help, analysis, cleaning)
export const assistantAreaFeatures: Record<AssistantPromptArea, AiFeatureKey> = {
  design: 'assistantDesign',
  help: 'chatbot',
  analysis: 'assistantAnalysis',
  cleaning: 'assistantCleaning',
}

const PROVIDER_ERROR_KEY = 'aiProviderUnavailable'
// the turn ended without an answer: with room left in the context, or because the context filled up
export const NO_ANSWER_ERROR_KEY = 'aiAssistantNoAnswer'
export const CONTEXT_FULL_ERROR_KEY = 'aiAssistantContextFull'
export const TOOL_CALL_TEXT_ERROR_KEY = 'aiAssistantToolCallText'

// small local models sometimes write the tool call as text: <|tool_call>...<tool_call|>, <tool_call>...</tool_call>
const TOOL_CALL_OPEN = /^<\|?tool_call\|?>/
const TOOL_CALL_CLOSE = /<\|?\/?tool_call\|?>$/

// the same call (tool and input) made this many times in a turn ends the tool loop, whether it fails or succeeds
export const REPEATED_FAILURE_LIMIT = 3
// steps of a turn: the last one has no tools (a model paging through results never repeats a call)
export const ASSISTANT_MAX_STEPS = 40

// why a step is sent without tools, and is the last one
export type LastStepReason = 'contextFull' | 'repeatedFailure' | 'repeatedCall' | 'stepLimit'

const REPEATED_FAILURE_NOTE =
  `${APPLY_NOTE_PREFIX}the same tool call failed ${REPEATED_FAILURE_LIMIT} times, so the tools are now off. ` +
  'Answer the user now with what you have, and say briefly what could not be done.'
const REPEATED_CALL_NOTE =
  `${APPLY_NOTE_PREFIX}the same tool call was made ${REPEATED_FAILURE_LIMIT} times and returned the same result, ` +
  'so the tools are now off. Answer the user now from the results you have.'
const STEP_LIMIT_NOTE =
  `${APPLY_NOTE_PREFIX}this turn reached its limit of ${ASSISTANT_MAX_STEPS} steps, so the tools are now off. ` +
  'Answer the user now with what you have, and say briefly what is left to do.'
const LAST_STEP_NOTES: Partial<Record<LastStepReason, string>> = {
  repeatedFailure: REPEATED_FAILURE_NOTE,
  repeatedCall: REPEATED_CALL_NOTE,
  stepLimit: STEP_LIMIT_NOTE,
}
const ANSWER_REQUEST_NOTE =
  `${APPLY_NOTE_PREFIX}you ended without writing an answer. Call the tool you still need, if any, ` +
  'then write the answer to the user from the results you have.'

// what the check reads of a step the SDK ran (StepResult)
type RanStep = {
  usage?: { inputTokens?: number }
  content: { type: string; toolName?: string; input?: unknown; output?: unknown }[]
}

/**
 * Returns the JSON of a value with the keys of its objects sorted, so the same input is one key in any key order.
 * @param {unknown} value - The value.
 * @returns {string} The JSON.
 */
const toSortedJson = (value: unknown): string =>
  JSON.stringify(value, (_key, nested) =>
    isWireObject(nested) ? Object.fromEntries(Object.entries(nested).sort(([a], [b]) => (a < b ? -1 : 1))) : nested
  )

/**
 * Tells whether one call (same tool, same input) was made REPEATED_FAILURE_LIMIT times in the turn.
 * @param {RanStep[]} steps - Steps of the turn so far.
 * @returns {LastStepReason|null} Whether the repeated call failed or succeeded, null when none is repeated.
 */
const getRepeatedCall = (steps: RanStep[]): LastStepReason | null => {
  const counts = new Map<string, number>()
  for (const part of steps.flatMap((step) => step.content)) {
    if (part.type !== 'tool-error' && part.type !== 'tool-result') continue
    // a tool that threw, or the structured error result of the tool wrapper
    const failed = part.type === 'tool-error' || Boolean((part.output as any)?.error)
    const key = `${failed}:${part.toolName}:${toSortedJson(part.input)}`
    const count = (counts.get(key) ?? 0) + 1
    if (count >= REPEATED_FAILURE_LIMIT) return failed ? 'repeatedFailure' : 'repeatedCall'
    counts.set(key, count)
  }
  return null
}

/**
 * Builds the check that ends the tool loop of a turn: the step it names is sent without tools, so the model answers
 * with what it has. The context is the limit (no room left for one more tool result), and a call that is repeated.
 * @param {object} params - Parameters.
 * @param {AssistantLimits} params.limits - Prompt limits of the engine.
 * @param {number} params.fixedChars - Characters of the system prompt and the tool definitions.
 * @returns {Function} The check of a step: the reason it is the last one, or null.
 */
export const getLastStepCheck = ({ limits, fixedChars }: { limits: AssistantLimits; fixedChars: number }) => {
  const resultCap = getToolResultCap(limits.maxPromptChars)
  // characters of the request before this one: the provider counted it in tokens
  let countedChars = 0
  return ({
    stepNumber,
    messages,
    steps,
  }: {
    stepNumber: number
    messages: unknown[]
    steps: RanStep[]
  }): LastStepReason | null => {
    const chars = fixedChars + JSON.stringify(messages).length
    const addedChars = chars - countedChars
    countedChars = chars
    // the first step keeps its tools: the model could never act otherwise
    if (stepNumber === 0) return null
    if (stepNumber >= ASSISTANT_MAX_STEPS - 1) return 'stepLimit'
    const repeated = getRepeatedCall(steps)
    if (repeated) return repeated
    const inputTokens = steps.at(-1)?.usage?.inputTokens
    // only what was added since the counted request is estimated (a context of unknown size: the characters decide)
    const full =
      limits.maxPromptTokens && inputTokens
        ? inputTokens + Math.ceil((addedChars + resultCap) / CHARS_PER_TOKEN) > limits.maxPromptTokens
        : chars + resultCap > limits.maxPromptChars
    return full ? 'contextFull' : null
  }
}

/**
 * Adds a note of Arena as a user message (joined to a last user message: some providers refuse two in a row).
 * @param {ModelMessage[]} messages - Messages of the request.
 * @param {string} note - The note.
 * @returns {ModelMessage[]} The messages with the note.
 */
const withNote = (messages: ModelMessage[], note: string): ModelMessage[] => {
  const last = messages.at(-1)
  return last?.role === 'user' && typeof last.content === 'string'
    ? [...messages.slice(0, -1), { ...last, content: `${last.content}\n\n${note}` }]
    : [...messages, { role: 'user', content: note }]
}

/**
 * Returns the settings of a step: none, or no tools on the last one (with the note after a repeated call).
 * @param {LastStepReason|null} reason - Why the step is the last one, or null.
 * @param {ModelMessage[]} messages - Messages of the step.
 * @returns {object|undefined} The prepareStep result.
 */
const toStepSettings = (reason: LastStepReason | null, messages: ModelMessage[]) => {
  if (!reason) return undefined
  const note = LAST_STEP_NOTES[reason]
  return note ? { toolChoice: 'none' as const, messages: withNote(messages, note) } : { toolChoice: 'none' as const }
}

/**
 * Returns the messages that ask a silent model for its answer: what it did, without the empty answer of its last step.
 * @param {ModelMessage[]} history - Messages the turn started with.
 * @param {ModelMessage[]} said - Messages of the model and its tools in the turn.
 * @returns {ModelMessage[]} The messages of the request.
 */
const toAnswerRequest = (history: ModelMessage[], said: ModelMessage[]): ModelMessage[] =>
  withNote([...history, ...(said.at(-1)?.role === 'assistant' ? said.slice(0, -1) : said)], ANSWER_REQUEST_NOTE)

export type RunAssistantTurnParams = {
  conversation: Conversation
  userMessage: string
  // what the chat shows instead of the user message (the model still gets userMessage)
  displayText?: string
  area: AssistantPromptArea
  ctx: AiToolContext
  // policy inputs the caller gives with its own model (tests); the resolver sets them otherwise
  access?: { effective: AiPolicy | null }
  onUpdate: (conversation: Conversation) => void
  signal: AbortSignal
  model?: LanguageModel
  limits?: AssistantLimits
  systemPrompt?: string
  tools?: AiTool[]
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
  // why the last step ran without tools (null: the model ended the turn by itself)
  lastStep: LastStepReason | null
  // set once the request is built: from then on the answer gets a usage
  sent: TurnUsageInputs | null
}

// a part of the full stream of the turn's tool loop
type TurnStreamPart = TextStreamPart<ToolSet>

/**
 * Applies one stream part to the turn state.
 * @param {TurnStreamPart} part - Full-stream part.
 * @param {TurnState} state - Turn state.
 * @param {StreamOutcome} outcome - Abort / error seen so far (updated).
 * @returns {void}
 */
const handleStreamPart = (part: TurnStreamPart, state: TurnState, outcome: StreamOutcome): void => {
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
 * Streams a request into the answer of the turn.
 * @param {object} params - Parameters.
 * @param {object} params.result - The streamText result.
 * @param {TurnState} params.state - Turn state.
 * @param {StreamOutcome} params.outcome - Abort / error seen so far (updated).
 * @param {AiTool[]} params.toolList - Tools offered in the turn.
 * @returns {Promise<void>}
 */
const streamInto = async ({
  result,
  state,
  outcome,
  toolList,
}: {
  result: { stream: AsyncIterable<TurnStreamPart> }
  state: TurnState
  outcome: StreamOutcome
  toolList: AiTool[]
}): Promise<void> => {
  for await (const part of result.stream) {
    handleStreamPart(part, state, outcome)
    escalateOnDataResult({ part, toolList, state })
  }
}

/**
 * Escalates the conversation's data class when a tool result carries data.
 * @param {object} params - Parameters.
 * @param {TurnStreamPart} params.part - Stream part.
 * @param {AiTool[]} params.toolList - Tools offered in the turn.
 * @param {TurnState} params.state - Turn state.
 * @returns {void}
 */
const escalateOnDataResult = ({
  part,
  toolList,
  state,
}: {
  part: TurnStreamPart
  toolList: AiTool[]
  state: TurnState
}): void => {
  if (part.type !== 'tool-result') return
  const tool = toolList.find((candidate) => candidate.name === part.toolName)
  // saved with the tool result: a turn stopped after a data result keeps the class
  if (tool && isDataToolResult({ tool, output: part.output })) state.escalateDataClass(tool.dataClass)
}

/**
 * Returns true when the answer of the turn has no text and no card (the model only called tools).
 * A proposed map layer is a card: an answer that is only one ends done.
 * @param {Conversation} after - Conversation at the end of the turn.
 * @param {Conversation} before - Conversation before the turn.
 * @returns {boolean} True for a silent turn.
 */
const isSilentTurn = (after: Conversation, before: Conversation): boolean => {
  const answer = after.messages.at(-1)
  // a text or a map card answers
  const hasContent =
    answer?.role === 'assistant' &&
    answer.parts.some(
      (part) =>
        (part.type === 'text' && part.text.trim()) ||
        (part.type === 'tool' && getProposedMapLayer({ toolName: part.toolName, output: part.output }))
    )
  if (hasContent || Object.keys(after.changeSets).length > Object.keys(before.changeSets).length) return false
  // a new query card answers (the only answer without data access), unless it repeats an earlier query
  const earlier = Object.values(before.queries ?? {})
  return !Object.values(after.queries ?? {}).some(
    (entry) => !before.queries?.[entry.id] && !earlier.some((old) => isDeepEqual(old.query, entry.query))
  )
}

/**
 * Returns true when the text is only a tool call written as text.
 * @param {string} text - Text written by the model.
 * @returns {boolean} True for markup only.
 */
const isToolCallText = (text: string): boolean => TOOL_CALL_OPEN.test(text.trim()) && TOOL_CALL_CLOSE.test(text.trim())

/**
 * Returns the text of the answer: of the whole turn, or only what follows the last tool call (the last step).
 * @param {Conversation} after - Conversation at the end of the turn.
 * @param {boolean} [lastStepOnly] - True for the text of the last step.
 * @returns {string} The text.
 */
const getAnswerText = (after: Conversation, lastStepOnly = false): string => {
  const answer = after.messages.at(-1)
  if (answer?.role !== 'assistant') return ''
  if (lastStepOnly) {
    const last = answer.parts.at(-1)
    return last?.type === 'text' ? last.text : ''
  }
  return answer.parts.map((part) => (part.type === 'text' ? part.text : '')).join('')
}

/**
 * Ends the turn from what the stream reported.
 * @param {TurnState} state - Turn state.
 * @param {StreamOutcome} outcome - Abort / error.
 * @param {AbortSignal} signal - Turn signal.
 * @param {Conversation} before - Conversation before the turn.
 * @returns {void}
 */
const finishTurn = (state: TurnState, outcome: StreamOutcome, signal: AbortSignal, before: Conversation): void => {
  const after = state.get()
  const forced = outcome.lastStep !== null
  // a model that calls a tool on the step that has none makes the SDK fail: that is no answer, not an error
  const toolCallOnLastStep = forced && ToolChoiceViolationError.isInstance(outcome.error)
  // a local server returns the tool call of that step as text: no answer either
  const noAnswer = isSilentTurn(after, before) || (forced && isToolCallText(getAnswerText(after, true)))
  if (outcome.aborted || signal.aborted || isAiAbortError(outcome.error)) state.finish('stopped')
  else if (outcome.error && !toolCallOnLastStep) {
    state.finish('error', getAiErrorKey(outcome.error) ?? PROVIDER_ERROR_KEY, getAiErrorParams(outcome.error))
  } else if (noAnswer) {
    state.finish('error', outcome.lastStep === 'contextFull' ? CONTEXT_FULL_ERROR_KEY : NO_ANSWER_ERROR_KEY)
  } else if (isToolCallText(getAnswerText(after))) state.finish('error', TOOL_CALL_TEXT_ERROR_KEY)
  else state.finish('done')
}

/**
 * Returns true when the model ended the turn by itself without a written answer (often after thinking only).
 * @param {object} params - Parameters.
 * @param {TurnState} params.state - Turn state.
 * @param {StreamOutcome} params.outcome - Abort / error.
 * @param {AbortSignal} params.signal - Turn signal.
 * @param {Conversation} params.before - Conversation before the turn.
 * @returns {boolean} True when the answer is worth asking for.
 */
const endedWithoutAnswer = ({
  state,
  outcome,
  signal,
  before,
}: {
  state: TurnState
  outcome: StreamOutcome
  signal: AbortSignal
  before: Conversation
}): boolean =>
  !outcome.lastStep &&
  !outcome.error &&
  !outcome.aborted &&
  !signal.aborted &&
  // a card alone is asked for its words too
  (isSilentTurn(state.get(), before) || !getAnswerText(state.get(), true).trim())

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
  const outcome: StreamOutcome = {
    aborted: false,
    error: null,
    stepTokens: null,
    lastStep: null,
    sent: null,
  }
  try {
    const feature = assistantAreaFeatures[area]
    // Help sends no survey content and no surveyId
    const surveyId = area !== 'help' && ctx.survey ? Survey.getId(ctx.survey) : undefined
    const turn = await resolveAssistantEngine({
      model,
      limits,
      defaultLimits: DEFAULT_ASSISTANT_LIMITS,
      access,
      feature,
      surveyId,
      // the conversation's class ('schema' for the assistant)
      dataClass: getConversationDataClass(conversation),
      // the provider picked in the chat (the default when absent or removed)
      providerId: conversation.providerId,
      signal,
      // declare data when the selected engine is offered a data tool (wraps the injected resolver)
      resolve: (params) =>
        resolveAssistantTurnModel({
          params,
          // the policy the engine is selected with: the same one the final tool list is made from
          getToolsForHosting: (hostingClass, effective) =>
            getTools({ area, ctx: turnCtx, effective, hostingClass, tools }),
          resolve,
        }),
    })
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
        mapToolAvailable: toolList.some((tool) => tool.name === MAP_PROPOSE_LAYER_TOOL_NAME),
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
    const getLastStep = getLastStepCheck({
      limits: turn.limits,
      fixedChars: system.length + getToolDefinitionChars(toolList),
    })
    const request = {
      model: turn.model,
      system,
      tools:
        toolList.length > 0 ? toAiSdkTools(toolList, turnCtx, getToolResultCap(turn.limits.maxPromptChars)) : undefined,
      abortSignal: signal,
      maxRetries: 0,
      // errors arrive as 'error' parts of the full stream
      onError: () => undefined,
    }
    const sink = { state, outcome, toolList }
    const runLoop = (messages: ModelMessage[]) =>
      streamText({
        ...request,
        messages,
        // the step without tools is the last one
        stopWhen: () => outcome.lastStep !== null,
        prepareStep: (step) => {
          outcome.lastStep = getLastStep(step)
          return toStepSettings(outcome.lastStep, step.messages)
        },
      })
    const result = runLoop(history.messages)
    await streamInto({ result, ...sink })
    if (endedWithoutAnswer({ state, outcome, signal, before: conversation })) {
      // asked once; the tools stay on: the model may have stopped one call short of the answer
      const messages = toAnswerRequest(history.messages, await result.responseMessages)
      await streamInto({ result: runLoop(messages), ...sink })
    }
  } catch (error) {
    outcome.error = error
  }
  // also on a stopped or failed answer: the meter then shows how full the context was
  if (outcome.sent) state.setUsage(buildTurnUsage({ stepTokens: outcome.stepTokens, ...outcome.sent }))
  finishTurn(state, outcome, signal, conversation)
  return state.get()
}
