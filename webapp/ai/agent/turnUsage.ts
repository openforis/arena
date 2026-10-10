/**
 * Context used by an assistant turn: the provider's token usage of the last step, or an estimate from the characters
 * sent (system prompt, tool definitions, history) when the provider reports none.
 */
import type { ModelMessage } from 'ai'

import type { AssistantMessageUsage } from '@webapp/ai/conversations/types'
import { CHARS_PER_TOKEN } from '@webapp/ai/engines/localServerProbe'
import type { AiContextWindow } from '@webapp/ai/engines/types'
import type { AiTool } from '@webapp/ai/tools/types'

import { getToolDefinitionChars } from './agentMessages'

export type TurnUsageInputs = {
  // estimate of what was sent, used when the provider reports no usage
  estimatedTokens: number
  droppedCount: number
  contextWindow: AiContextWindow | null
}

/**
 * Returns true for a positive finite number.
 * @param {unknown} value - Value.
 * @returns {boolean} True when counted.
 */
const isCount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0

/**
 * Returns the tokens the model held at the end of a step: input plus output.
 * @param {object} [usage] - AI SDK step usage.
 * @returns {number|null} The tokens, or null when the input is not counted (no usage, or zeros).
 */
export const toContextTokens = (
  usage: { inputTokens?: number | undefined; outputTokens?: number | undefined } | undefined
): number | null => {
  if (!isCount(usage?.inputTokens)) return null
  return usage.inputTokens + (isCount(usage.outputTokens) ? usage.outputTokens : 0)
}

/**
 * Returns the characters of the history messages.
 * @param {ModelMessage[]} messages - Messages sent.
 * @returns {number} Their content length.
 */
const messageChars = (messages: ModelMessage[]): number => {
  let total = 0
  for (const message of messages) {
    total += typeof message.content === 'string' ? message.content.length : JSON.stringify(message.content).length
  }
  return total
}

/**
 * Estimates the tokens of a request.
 * @param {object} params - Parameters.
 * @param {string} params.systemPrompt - System prompt.
 * @param {AiTool[]} params.tools - Tools offered.
 * @param {ModelMessage[]} params.messages - History sent (new message included).
 * @returns {number} ceil(characters / 3).
 */
export const estimateContextTokens = ({
  systemPrompt,
  tools,
  messages,
}: {
  systemPrompt: string
  tools: AiTool[]
  messages: ModelMessage[]
}): number =>
  Math.ceil((systemPrompt.length + getToolDefinitionChars(tools) + messageChars(messages)) / CHARS_PER_TOKEN)

/**
 * Builds the usage stored on the answer.
 * @param {object} params - Parameters.
 * @param {number|null} params.stepTokens - Tokens of the last step, or null when not reported.
 * @param {number} params.estimatedTokens - Estimate of the request.
 * @param {number} params.droppedCount - Earlier messages left out.
 * @param {AiContextWindow|null} params.contextWindow - Window of the engine, or null.
 * @returns {AssistantMessageUsage} The usage.
 */
export const buildTurnUsage = ({
  stepTokens,
  estimatedTokens,
  droppedCount,
  contextWindow,
}: TurnUsageInputs & { stepTokens: number | null }): AssistantMessageUsage => ({
  contextTokens: stepTokens ?? estimatedTokens,
  windowTokens: contextWindow?.tokens ?? null,
  windowAssumed: contextWindow?.assumed ?? false,
  estimated: stepTokens === null,
  historyTrimmed: droppedCount > 0,
})
