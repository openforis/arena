/**
 * Conversation → model messages. Earlier turns go as plain text: their tool results described the survey as it
 * was, so the model reads again instead of trusting them.
 */
import type { ModelMessage } from 'ai'

import type { AssistantMessage, ConversationMessage, ConversationToolPart } from '@webapp/ai/conversations/types'
import { toWebMcpDescriptor } from '@webapp/ai/tools/registry'
import type { AiTool } from '@webapp/ai/tools/types'

export const APPLY_NOTE_PREFIX = 'Note from Arena (not the user): '

const STOPPED_NOTE = '[stopped by the user]'
const HISTORY_SHARE = 0.8

type TextMessage = { role: 'user' | 'assistant'; content: string }

/**
 * Describes a tool call of an earlier turn.
 * @param {ConversationToolPart} part - Tool part.
 * @returns {string} A short bracketed note.
 */
export const describeToolPart = (part: ConversationToolPart): string => {
  const output = part.output as any
  if (part.state === 'running') return `[${part.toolName} was interrupted]`
  if (part.state === 'failed' || output?.error)
    return `[${part.toolName} failed: ${output?.error?.code ?? 'toolFailed'}]`
  if (typeof output?.changeSetId === 'string') {
    return `[${part.toolName}: change set ${output.changeSetId} (${output.operations} operations) shown to the user]`
  }
  const list = output && typeof output === 'object' ? Object.values(output).find(Array.isArray) : null
  return list ? `[${part.toolName} returned ${list.length} items]` : `[${part.toolName} done]`
}

/**
 * Flattens an answer into text lines, tool calls as notes.
 * @param {AssistantMessage} message - Assistant message.
 * @returns {string} The text, empty when the answer has no content.
 */
const assistantText = (message: AssistantMessage): string => {
  const lines = message.parts
    .map((part) => (part.type === 'text' ? part.text.trim() : describeToolPart(part)))
    .filter((line) => line.length > 0)
  if (lines.length > 0 && message.status === 'stopped') lines.push(STOPPED_NOTE)
  return lines.join('\n')
}

/**
 * Converts a conversation message to a plain text message.
 * @param {ConversationMessage} message - Conversation message.
 * @returns {TextMessage | null} The text message, or null when it is left out.
 */
const toTextMessage = (message: ConversationMessage): TextMessage | null => {
  if (message.role === 'user') return { role: 'user', content: message.text }
  if (message.role === 'applyNote') return { role: 'user', content: `${APPLY_NOTE_PREFIX}${message.text}` }
  if (message.status === 'error' || message.status === 'streaming') return null
  const content = assistantText(message)
  return content ? { role: 'assistant', content } : null
}

// some providers refuse two consecutive messages of the same role
/**
 * Merges consecutive messages of the same role.
 * @param {TextMessage[]} messages - Messages in order.
 * @returns {TextMessage[]} Messages that alternate roles.
 */
const mergeSameRole = (messages: TextMessage[]): TextMessage[] => {
  const merged: TextMessage[] = []
  for (const message of messages) {
    const last = merged.at(-1)
    if (last?.role === message.role)
      merged[merged.length - 1] = { ...last, content: `${last.content}\n\n${message.content}` }
    else merged.push({ ...message })
  }
  return merged
}

/**
 * Drops the oldest messages until the text fits the budget.
 * @param {TextMessage[]} earlier - Earlier messages, oldest first.
 * @param {TextMessage} newMessage - The new user message, always kept.
 * @param {number} budgetChars - Characters available.
 * @returns {TextMessage[]} Kept messages, not starting with an answer, the new message last.
 */
const fitBudget = (earlier: TextMessage[], newMessage: TextMessage, budgetChars: number): TextMessage[] => {
  let total = newMessage.content.length
  let start = earlier.length
  while (start > 0 && total + earlier[start - 1].content.length <= budgetChars) {
    start -= 1
    total += earlier[start].content.length
  }
  const kept = earlier.slice(start)
  while (kept[0]?.role === 'assistant') kept.shift()
  return [...kept, newMessage]
}

/**
 * Builds the model messages of a turn.
 * @param {object} params - Parameters.
 * @param {ConversationMessage[]} params.messages - Earlier messages of the conversation.
 * @param {string} params.userMessage - The new user message.
 * @param {number} params.budgetChars - Characters available for the history (new message included).
 * @returns {ModelMessage[]} The messages, the new user message last.
 */
export const buildHistory = ({
  messages,
  userMessage,
  budgetChars,
}: {
  messages: ConversationMessage[]
  userMessage: string
  budgetChars: number
}): ModelMessage[] => {
  const all = mergeSameRole([
    ...messages.map(toTextMessage).filter((message): message is TextMessage => message !== null),
    { role: 'user', content: userMessage },
  ])
  const newMessage = all[all.length - 1]
  return fitBudget(all.slice(0, -1), newMessage, budgetChars)
}

/**
 * Returns the characters left for the history of a turn.
 * @param {object} params - Parameters.
 * @param {number} params.maxPromptChars - Prompt limit of the engine.
 * @param {string} params.systemPrompt - System prompt.
 * @param {AiTool[]} params.tools - Tools offered (their schemas count toward the limit).
 * @returns {number} The budget, at least 0.
 */
export const getHistoryBudget = ({
  maxPromptChars,
  systemPrompt,
  tools,
}: {
  maxPromptChars: number
  systemPrompt: string
  tools: AiTool[]
}): number => {
  const toolChars = tools.length > 0 ? JSON.stringify(tools.map(toWebMcpDescriptor)).length : 0
  return Math.max(0, Math.floor(maxPromptChars * HISTORY_SHARE) - systemPrompt.length - toolChars)
}
