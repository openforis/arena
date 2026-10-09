/**
 * Wire format of the AI gateway (`POST /api/ai/model`): what crosses between the server proxy and the
 * browser model. Only text/reasoning content, finish data and mapped error keys are forwarded; provider
 * metadata, raw chunks and upstream request/response bodies stay on the server.
 */
import type {
  LanguageModelV4CallOptions,
  LanguageModelV4GenerateResult,
  LanguageModelV4StreamPart,
} from '@ai-sdk/provider'

import SystemError, { StatusCodes } from '@core/systemError'

export const AI_GATEWAY_URL = '/api/ai/model'

export type AiGatewayCall = Pick<
  LanguageModelV4CallOptions,
  | 'prompt'
  | 'maxOutputTokens'
  | 'temperature'
  | 'topP'
  | 'topK'
  | 'presencePenalty'
  | 'frequencyPenalty'
  | 'seed'
  | 'stopSequences'
  | 'responseFormat'
>

export type AiGatewayRequest = {
  surveyId?: number
  feature: string
  dataClass: 'schema' | 'data'
  stream: boolean
  call: AiGatewayCall
}

export type AiWireError = { key: string; params?: Record<string, unknown> }

const FORWARDED_TEXT_PARTS = new Set([
  'text-start',
  'text-delta',
  'text-end',
  'reasoning-start',
  'reasoning-delta',
  'reasoning-end',
])

const FORWARDED_CONTENT_TYPES = new Set(['text', 'reasoning'])

const withoutProviderMetadata = <T extends object>(value: T): T => {
  const copy = { ...value } as T & { providerMetadata?: unknown }
  delete copy.providerMetadata
  return copy
}

const serializeResponseMetadata = (metadata: { id?: string; modelId?: string; timestamp?: Date }) => ({
  id: metadata.id,
  modelId: metadata.modelId,
  timestamp: metadata.timestamp instanceof Date ? metadata.timestamp.toISOString() : undefined,
})

const reviveTimestamp = <T extends { timestamp?: unknown }>(value: T): T =>
  typeof value?.timestamp === 'string' ? { ...value, timestamp: new Date(value.timestamp) } : value

/**
 * Converts a stream part to its JSON wire form.
 * @param {LanguageModelV4StreamPart} part - Part from the provider.
 * @param {Function} mapError - Maps an error to its wire form (key + params, no upstream details).
 * @returns {object|null} The wire part, or null when the part is not forwarded.
 */
export const serializeStreamPart = (
  part: LanguageModelV4StreamPart,
  mapError: (error: unknown) => AiWireError
): object | null => {
  if (FORWARDED_TEXT_PARTS.has(part.type)) return withoutProviderMetadata(part)
  switch (part.type) {
    case 'stream-start':
      return { type: 'stream-start', warnings: part.warnings ?? [] }
    case 'response-metadata':
      return { type: 'response-metadata', ...serializeResponseMetadata(part) }
    case 'finish':
      return { type: 'finish', finishReason: part.finishReason, usage: part.usage }
    case 'error':
      return { type: 'error', error: mapError(part.error) }
    default:
      return null
  }
}

/**
 * Converts a wire part back to a stream part (browser side).
 * @param {object} json - Parsed wire part.
 * @returns {LanguageModelV4StreamPart} The stream part; error parts carry a SystemError.
 */
export const deserializeStreamPart = (json: any): LanguageModelV4StreamPart => {
  if (json?.type === 'response-metadata') return reviveTimestamp(json)
  if (json?.type === 'error') {
    const { key = 'aiProviderUnavailable', params } = json.error ?? {}
    return { type: 'error', error: new SystemError(key, params, StatusCodes.BAD_GATEWAY) }
  }
  return json
}

/**
 * Converts a generate result to its JSON wire form.
 * @param {LanguageModelV4GenerateResult} result - Result from the provider.
 * @returns {object} The wire result.
 */
export const serializeGenerateResult = (result: LanguageModelV4GenerateResult): object => ({
  content: result.content.filter((part) => FORWARDED_CONTENT_TYPES.has(part.type)).map(withoutProviderMetadata),
  finishReason: result.finishReason,
  usage: result.usage,
  warnings: result.warnings ?? [],
  response: result.response ? serializeResponseMetadata(result.response) : undefined,
})

/**
 * Converts a wire result back to a generate result (browser side).
 * @param {object} json - Parsed wire result.
 * @returns {LanguageModelV4GenerateResult} The generate result.
 */
export const deserializeGenerateResult = (json: any): LanguageModelV4GenerateResult => ({
  ...json,
  response: json?.response ? reviveTimestamp(json.response) : undefined,
})
