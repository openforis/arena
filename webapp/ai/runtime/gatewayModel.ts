/**
 * LanguageModelV4 backed by the Arena AI gateway (POST /api/ai/model): the browser runs the AI SDK, the
 * server only checks, resolves the provider and forwards the call.
 */
import type { LanguageModelV4, LanguageModelV4CallOptions } from '@ai-sdk/provider'

import SystemError from '@core/systemError'
import { AI_GATEWAY_URL, deserializeGenerateResult, type AiGatewayCall } from '@common/ai/wire'

import type { FetchLike } from './authorizedFetch'
import { readSseParts } from './sseReader'

const FORWARDED_OPTIONS = [
  'prompt',
  'maxOutputTokens',
  'temperature',
  'topP',
  'topK',
  'presencePenalty',
  'frequencyPenalty',
  'seed',
  'stopSequences',
] as const

const KEY_BY_STATUS: Record<number, string> = {
  401: 'aiSessionExpired',
  403: 'aiNotAuthorized',
  404: 'aiFeaturesDisabled',
  413: 'aiPromptTooLarge',
  429: 'aiRateLimited',
  504: 'aiRequestTimeout',
}

/**
 * Error key used when the error body has no AI key (e.g. proxy pages, auth middleware errors).
 * @param {number} status - HTTP status.
 * @returns {string} The error key.
 */
export const getErrorKeyForHttpStatus = (status: number): string => KEY_BY_STATUS[status] ?? 'aiProviderUnavailable'

/** Keeps only the call options the gateway accepts. */
const toGatewayCall = (options: LanguageModelV4CallOptions): AiGatewayCall => {
  const call: Record<string, unknown> = {}
  for (const name of FORWARDED_OPTIONS) {
    if (options[name] !== undefined) call[name] = options[name]
  }
  if (options.responseFormat) call.responseFormat = { type: options.responseFormat.type }
  return call as AiGatewayCall
}

/** Reads the key and params of a gateway error body (current or legacy shape); empty when unreadable. */
const readErrorBody = async (response: Response): Promise<{ key?: string; params?: Record<string, unknown> }> => {
  try {
    const body = await response.json()
    const key = body?.key ?? body?.error?.key ?? (typeof body?.error === 'string' ? body.error : undefined)
    return { key, params: body?.params ?? body?.error?.params }
  } catch {
    return {}
  }
}

/** Converts an error response to a SystemError; only AI keys are kept, anything else is mapped from the status. */
const toHttpError = async (response: Response): Promise<SystemError> => {
  const { key, params } = await readErrorBody(response)
  const aiKey = typeof key === 'string' && /^ai[A-Z]/.test(key) ? key : getErrorKeyForHttpStatus(response.status)
  return new SystemError(aiKey, params ?? {}, response.status)
}

/**
 * Creates the gateway model for one feature.
 * @param {object} params - Parameters.
 * @param {string} params.feature - Feature key (see common/ai/features).
 * @param {string} params.dataClass - Data class of the feature.
 * @param {number} [params.surveyId] - Survey (required for survey-scoped features).
 * @param {FetchLike} params.fetchImpl - Authorized fetch.
 * @returns {LanguageModelV4} The model.
 */
export const createGatewayModel = ({
  feature,
  dataClass,
  surveyId,
  fetchImpl,
}: {
  feature: string
  dataClass: 'schema' | 'data'
  surveyId?: number
  fetchImpl: FetchLike
}): LanguageModelV4 => {
  const post = async (options: LanguageModelV4CallOptions, stream: boolean): Promise<Response> => {
    const response = await fetchImpl(AI_GATEWAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: stream ? 'text/event-stream' : 'application/json' },
      body: JSON.stringify({ surveyId, feature, dataClass, stream, call: toGatewayCall(options) }),
      signal: options.abortSignal,
    })
    if (!response.ok) throw await toHttpError(response)
    return response
  }

  return {
    specificationVersion: 'v4',
    provider: 'arena-gateway',
    modelId: feature,
    supportedUrls: {},
    async doGenerate(options) {
      const response = await post(options, false)
      return deserializeGenerateResult(await response.json())
    },
    async doStream(options) {
      const response = await post(options, true)
      return { stream: readSseParts(response) }
    },
  }
}
