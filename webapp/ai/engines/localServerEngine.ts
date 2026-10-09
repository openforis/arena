/**
 * Local AI server engine (LM Studio or any OpenAI-compatible server), called directly from the browser.
 * Loaded only through dynamic import: it pulls @ai-sdk/openai-compatible into the lazy AI bundle.
 */
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { LanguageModel } from 'ai'

import SystemError, { StatusCodes } from '@core/systemError'

import { getLocalServerEngineInfo } from './engineInfo'
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
  const info = getLocalServerEngineInfo(localServer)
  const { baseUrl, modelId } = localServer
  if (!info || !baseUrl || !modelId) {
    throw new SystemError('aiNoEngineAvailable', { reasons: ['localServerNoModel'] }, StatusCodes.CONFLICT)
  }
  const provider = createOpenAICompatible({
    name: 'localServer',
    baseURL: baseUrl,
    supportsStructuredOutputs: true,
    fetch: createLocalServerFetch({ fetchImpl, baseUrl, modelId }) as typeof fetch,
  })
  return { ...info, createModel: (): LanguageModel => provider(modelId) }
}
