/**
 * Text generation helpers over any LanguageModel (in practice the gateway model). No client-side retries:
 * the gateway already maps provider failures, and retrying a rate-limited call makes it worse.
 */
import { generateText, streamText, type LanguageModel, type ModelMessage } from 'ai'

import type { AiGenerateText } from '@common/ai/llm'

/**
 * Wraps the model as an AiGenerateText (used by the shared tasks).
 * @param {LanguageModel} model - The model.
 * @returns {AiGenerateText} The generator.
 */
export const createGatewayTextGenerator =
  (model: LanguageModel): AiGenerateText =>
  async ({ system, prompt, signal }) => {
    const result = await generateText({ model, system, prompt, abortSignal: signal, maxRetries: 0 })
    return result.text
  }

/**
 * Streams the answer, calling onChunk with each text delta; rejects with the error of an error part.
 * @param {object} params - Parameters.
 * @param {LanguageModel} params.model - The model.
 * @param {string} [params.system] - System prompt.
 * @param {string} [params.prompt] - Prompt (or messages).
 * @param {ModelMessage[]} [params.messages] - Conversation (or prompt).
 * @param {Function} params.onChunk - Called with each text chunk.
 * @param {AbortSignal} [params.signal] - Cancellation signal.
 * @returns {Promise<void>} Resolves when the answer is complete.
 */
export const streamTextChunks = async ({
  model,
  system,
  prompt,
  messages,
  onChunk,
  signal,
}: {
  model: LanguageModel
  system?: string
  prompt?: string
  messages?: ModelMessage[]
  onChunk: (chunk: string) => void
  signal?: AbortSignal
}): Promise<void> => {
  const options = { model, system, abortSignal: signal, maxRetries: 0, onError: () => {} }
  // errors are read from fullStream; the noop onError keeps the SDK from logging them to the console
  const result = messages ? streamText({ ...options, messages }) : streamText({ ...options, prompt: prompt ?? '' })
  for await (const part of result.fullStream) {
    if (part.type === 'text-delta') onChunk(part.text)
    else if (part.type === 'error') throw part.error
  }
}
