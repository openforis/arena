/**
 * Wire format of the AI gateway (`POST /api/ai/model`): what crosses between the server proxy and the
 * browser model. Only text/reasoning content, client tool calls, finish data and mapped error keys are forwarded; provider
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
  | 'tools'
  | 'toolChoice'
>

export type AiGatewayRequest = {
  surveyId?: number
  // provider to call (common/ai/providerIds.ts); optional in the type only: the server refuses a request
  // without it (400 aiCallInvalid, reason 'providerId')
  providerId?: string
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

const FORWARDED_CONTENT_TYPES = new Set(['text', 'reasoning', 'tool-call'])

type ToolCallLike = {
  type: 'tool-call'
  toolCallId: string
  toolName: string
  input: string
  providerExecuted?: boolean
}

// client tool calls only (the browser runs the tool); provider-executed ones stay on the server
const isClientToolCall = (part: { type: string; providerExecuted?: boolean }): boolean =>
  part.type === 'tool-call' && part.providerExecuted !== true

const toWireToolCall = ({ toolCallId, toolName, input }: ToolCallLike) => ({
  type: 'tool-call' as const,
  toolCallId,
  toolName,
  input,
})

// the model may only call the tools the request offered; anything else never reaches the browser
const assertToolOffered = (toolName: string, offeredToolNames: ReadonlySet<string> | undefined): void => {
  if (offeredToolNames && !offeredToolNames.has(toolName)) {
    throw new SystemError('aiToolNotOffered', {}, StatusCodes.BAD_GATEWAY)
  }
}

// a client tool call as sent to the browser
const toCheckedWireToolCall = (part: ToolCallLike, offeredToolNames: ReadonlySet<string> | undefined) => {
  assertToolOffered(part.toolName, offeredToolNames)
  return toWireToolCall(part)
}

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
 * @param {ReadonlySet<string>} [offeredToolNames] - The tools the request offered; a tool call for any other tool
 *   throws aiToolNotOffered (all tool calls pass when absent).
 * @returns {object|null} The wire part, or null when the part is not forwarded.
 */
export const serializeStreamPart = (
  part: LanguageModelV4StreamPart,
  mapError: (error: unknown) => AiWireError,
  offeredToolNames?: ReadonlySet<string>
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
    case 'tool-call':
      return isClientToolCall(part) ? toCheckedWireToolCall(part as ToolCallLike, offeredToolNames) : null
    default:
      return null
  }
}

// JSON from the wire: an object, nothing else is known about it until it is checked
type WireObject = Record<string, unknown>

/**
 * Returns whether the parsed JSON is an object.
 * @param {unknown} json - Parsed JSON.
 * @returns {boolean} True for an object that is not null or an array.
 */
const isWireObject = (json: unknown): json is WireObject =>
  typeof json === 'object' && json !== null && !Array.isArray(json)

/**
 * Builds the error of a payload that is not what the gateway sends.
 * @returns {SystemError} aiProviderUnavailable (bad gateway).
 */
const malformedWirePayload = () => new SystemError('aiProviderUnavailable', {}, StatusCodes.BAD_GATEWAY)

/**
 * Converts a wire part back to a stream part (browser side).
 * @param {unknown} json - Parsed wire part.
 * @returns {LanguageModelV4StreamPart} The stream part; error parts carry a SystemError.
 * @throws {SystemError} aiProviderUnavailable when the payload is not an object with a type.
 */
export const deserializeStreamPart = (json: unknown): LanguageModelV4StreamPart => {
  if (!isWireObject(json) || typeof json.type !== 'string') throw malformedWirePayload()
  if (json.type === 'response-metadata') return reviveTimestamp(json) as LanguageModelV4StreamPart
  if (json.type === 'error') {
    const { key = 'aiProviderUnavailable', params } = (isWireObject(json.error) ? json.error : {}) as {
      key?: string
      params?: Record<string, unknown>
    }
    return { type: 'error', error: new SystemError(key, params, StatusCodes.BAD_GATEWAY) }
  }
  return json as LanguageModelV4StreamPart
}

/**
 * Converts a generate result to its JSON wire form.
 * @param {LanguageModelV4GenerateResult} result - Result from the provider.
 * @param {ReadonlySet<string>} [offeredToolNames] - The tools the request offered; a tool call for any other tool
 *   throws aiToolNotOffered (all tool calls pass when absent).
 * @returns {object} The wire result.
 */
export const serializeGenerateResult = (
  result: LanguageModelV4GenerateResult,
  offeredToolNames?: ReadonlySet<string>
): object => ({
  content: result.content
    .filter((part) => FORWARDED_CONTENT_TYPES.has(part.type) && (part.type !== 'tool-call' || isClientToolCall(part)))
    .map((part) =>
      part.type === 'tool-call'
        ? toCheckedWireToolCall(part as ToolCallLike, offeredToolNames)
        : withoutProviderMetadata(part)
    ),
  finishReason: result.finishReason,
  usage: result.usage,
  warnings: result.warnings ?? [],
  response: result.response ? serializeResponseMetadata(result.response) : undefined,
})

/**
 * Converts a wire result back to a generate result (browser side).
 * @param {unknown} json - Parsed wire result.
 * @returns {LanguageModelV4GenerateResult} The generate result.
 * @throws {SystemError} aiProviderUnavailable when the payload is not an object.
 */
export const deserializeGenerateResult = (json: unknown): LanguageModelV4GenerateResult => {
  if (!isWireObject(json)) throw malformedWirePayload()
  const response = isWireObject(json.response) ? reviveTimestamp(json.response) : undefined
  return { ...json, response } as unknown as LanguageModelV4GenerateResult
}
