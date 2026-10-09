/**
 * Help chat: streams the assistant answer through the gateway. The conversation lives in the browser
 * (session storage); the server keeps nothing.
 */
import type { LanguageModel } from 'ai'

import { buildChatSystemPrompt } from '@common/ai/prompts/chat'
import { validateChatMessages, type AiChatUiMessage } from '@common/ai/tasks/chat'

import { resolveGatewayModel } from '../runtime/resolveModel'
import { streamTextChunks } from '../runtime/textGenerators'

/**
 * Streams the answer to the conversation.
 * @param {object} params - Parameters.
 * @param {AiChatUiMessage[]} params.messages - Conversation ({role, parts}).
 * @param {string} params.language - Language the assistant must answer in.
 * @param {Function} params.onChunk - Called with each text chunk.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @param {LanguageModel} [params.model] - Model (tests).
 * @returns {Promise<void>} Resolves when the answer is complete.
 */
export const streamChatWorkflow = async ({
  messages,
  language,
  onChunk,
  signal,
  model,
}: {
  messages: AiChatUiMessage[]
  language: string
  onChunk: (chunk: string) => void
  signal?: AbortSignal
  model?: LanguageModel
}): Promise<void> => {
  const validMessages = validateChatMessages(messages)
  await streamTextChunks({
    model: await resolveGatewayModel({ model, feature: 'chatbot' }),
    system: buildChatSystemPrompt(language),
    messages: validMessages,
    onChunk,
    signal,
  })
}
