/**
 * Local AI server engine (LM Studio or any OpenAI-compatible server), called directly from the browser.
 * Loaded only through dynamic import: it pulls @ai-sdk/openai-compatible into the lazy AI bundle.
 */
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { extractReasoningMiddleware, wrapLanguageModel, type LanguageModel } from 'ai'

import SystemError, { StatusCodes } from '@core/systemError'

import { createLocalServerFetch, type LocalServerFetchImpl } from './localServerErrors'
import type { AiEngine, AiLocalServerCapability } from './types'

/**
 * Creates the local server engine.
 * @param {object} params - Parameters.
 * @param {AiLocalServerCapability} params.localServer - Probed local server (URL, chosen model, context).
 * @param {LocalServerFetchImpl} params.fetchImpl - Underlying fetch (the browser's, bound).
 * @returns {AiEngine} The engine.
 */
export const createLocalServerEngine = ({
  localServer,
  fetchImpl,
}: {
  localServer: AiLocalServerCapability
  fetchImpl: LocalServerFetchImpl
}): AiEngine => {
  const { baseUrl, modelId, hostingClass } = localServer
  // selectEngine only selects a server with a known URL and hosting class; a model must be chosen
  if (!baseUrl || !modelId || !hostingClass) {
    throw new SystemError('aiNoEngineAvailable', { reasons: ['notAvailable'] }, StatusCodes.CONFLICT)
  }
  const provider = createOpenAICompatible({
    name: 'localServer',
    baseURL: baseUrl,
    supportsStructuredOutputs: true,
    // LM Studio sends the token usage of a stream only when asked (the assistant's context meter)
    includeUsage: true,
    fetch: createLocalServerFetch({ fetchImpl, baseUrl, modelId }) as typeof fetch,
  })
  // models whose server doesn't split the thinking out write it inline in <think> tags: move it to reasoning parts
  const reasoning = extractReasoningMiddleware({ tagName: 'think' })
  return { createModel: (): LanguageModel => wrapLanguageModel({ model: provider(modelId), middleware: reasoning }) }
}
