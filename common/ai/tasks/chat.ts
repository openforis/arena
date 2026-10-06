/**
 * Documentation chatbot: validation of the conversation kept by the chat panel (UI message shape).
 */
import SystemError, { StatusCodes } from '@core/systemError'

import { AiLimits } from '../limits'

export type AiChatUiMessage = { role: string; parts: { type: string; text?: string }[] }
export type AiChatModelMessage = { role: 'user' | 'assistant'; content: string }

const ALLOWED_ROLES = new Set(['user', 'assistant'])

const invalidPayload = () => new SystemError('aiChatbotPayloadTooLarge', {}, StatusCodes.BAD_REQUEST)

const isTextPart = (part: unknown): boolean =>
  !!part && typeof part === 'object' && part['type'] === 'text' && typeof part['text'] === 'string'

const toModelMessage = (message: unknown): AiChatModelMessage => {
  if (!message || typeof message !== 'object') throw invalidPayload()
  const { role, parts } = message as AiChatUiMessage
  if (!ALLOWED_ROLES.has(role) || !Array.isArray(parts) || parts.length === 0) throw invalidPayload()
  if (!parts.every(isTextPart)) throw invalidPayload()
  const content = parts.map((part) => part.text).join('')
  if (content.length > AiLimits.chatMessageMaxChars) throw invalidPayload()
  return { role: role as AiChatModelMessage['role'], content }
}

/**
 * Validates the conversation and converts it to model messages (empty messages are dropped).
 * @param {unknown} messages - The conversation, as kept by the chat panel.
 * @returns {AiChatModelMessage[]} The model messages.
 * @throws {SystemError} `aiChatbotPayloadTooLarge` when the conversation is malformed or too large.
 */
export const validateChatMessages = (messages: unknown): AiChatModelMessage[] => {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > AiLimits.chatMaxMessages) {
    throw invalidPayload()
  }
  return messages.map(toModelMessage).filter((message) => message.content.length > 0)
}
