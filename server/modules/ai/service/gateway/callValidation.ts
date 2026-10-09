/**
 * Validation of the gateway request (feature, data class, survey) and sanitising of the forwarded model
 * call: text-only prompt, no tools/files/provider options, capped output, bounded prompt size.
 */
import SystemError, { StatusCodes } from '@core/systemError'
import { AiFeaturePermission, getAiFeature, isGatewayFeature } from '@common/ai/features'
import type { AiGatewayCall, AiGatewayRequest } from '@common/ai/wire'

const PAYLOAD_TOO_LARGE = 413
const MAX_STOP_SEQUENCES = 4
const MAX_STOP_SEQUENCE_CHARS = 100
const NUMERIC_OPTIONS = ['temperature', 'topP', 'topK', 'presencePenalty', 'frequencyPenalty', 'seed'] as const

const invalid = (reason: string) => new SystemError('aiCallInvalid', { reason }, StatusCodes.BAD_REQUEST)

const isObject = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const parseSurveyId = (value: unknown, required: boolean): number | undefined => {
  if (value === undefined || value === null) {
    if (required) throw invalid('surveyId')
    return undefined
  }
  const surveyId = Number(value)
  if (!Number.isInteger(surveyId) || surveyId <= 0 || String(value) !== String(surveyId)) throw invalid('surveyId')
  return surveyId
}

/**
 * Validates the envelope of a gateway request (the call itself is checked by sanitizeCall).
 * @param {unknown} body - Request body.
 * @returns {AiGatewayRequest} The request.
 */
export const parseGatewayRequest = (body: unknown): AiGatewayRequest => {
  if (!isObject(body)) throw invalid('body')
  const { feature, dataClass, stream, call } = body
  if (typeof feature !== 'string' || !isGatewayFeature(feature)) {
    throw new SystemError('aiFeatureUnknown', { feature: String(feature).slice(0, 64) }, StatusCodes.BAD_REQUEST)
  }
  const featureDef = getAiFeature(feature)
  if (dataClass !== featureDef.dataClass) throw invalid('dataClass')
  if (typeof stream !== 'boolean') throw invalid('stream')
  if (!isObject(call)) throw invalid('call')
  const surveyId = parseSurveyId(body.surveyId, featureDef.permission !== AiFeaturePermission.loggedIn)
  return { surveyId, feature, dataClass, stream, call: call as AiGatewayCall }
}

const isTextPart = (part: unknown): boolean => isObject(part) && part.type === 'text' && typeof part.text === 'string'

// Rebuilds the message from { role, content } (and text parts from { type, text }) so that extra keys,
// e.g. providerOptions, are dropped. System content is a string, user/assistant content text parts only.
const rebuildMessage = (message: unknown): any => {
  if (!isObject(message)) throw invalid('prompt')
  const { role, content } = message
  if (role === 'system') {
    if (typeof content !== 'string') throw invalid('prompt.system')
    return { role, content }
  }
  if (role !== 'user' && role !== 'assistant') throw invalid('prompt.role')
  if (!Array.isArray(content) || !content.every(isTextPart)) throw invalid('prompt.content')
  return { role, content: content.map((part) => ({ type: 'text', text: part.text })) }
}

const messageSize = (message: any): number =>
  typeof message.content === 'string'
    ? message.content.length
    : message.content.reduce((total: number, part: any) => total + part.text.length, 0)

const sanitizePrompt = (prompt: unknown, maxPromptChars: number): AiGatewayCall['prompt'] => {
  if (!Array.isArray(prompt) || prompt.length === 0) throw invalid('prompt')
  const rebuilt = prompt.map(rebuildMessage)
  const size = rebuilt.reduce((total, message) => total + messageSize(message), 0)
  if (size > maxPromptChars) {
    throw new SystemError('aiPromptTooLarge', { size, limit: maxPromptChars }, PAYLOAD_TOO_LARGE)
  }
  return rebuilt
}

const pickNumericOptions = (call: Record<string, any>): Partial<AiGatewayCall> => {
  const picked: Record<string, number> = {}
  for (const name of NUMERIC_OPTIONS) {
    const value = call[name]
    if (value === undefined) continue
    if (typeof value !== 'number' || !Number.isFinite(value)) throw invalid(name)
    picked[name] = value
  }
  return picked as unknown as Partial<AiGatewayCall>
}

const pickStopSequences = (value: unknown): string[] | undefined => {
  if (value === undefined) return undefined
  const valid =
    Array.isArray(value) &&
    value.length <= MAX_STOP_SEQUENCES &&
    value.every((item) => typeof item === 'string' && item.length <= MAX_STOP_SEQUENCE_CHARS)
  if (!valid) throw invalid('stopSequences')
  return value
}

const pickResponseFormat = (value: unknown): AiGatewayCall['responseFormat'] => {
  if (value === undefined) return undefined
  if (!isObject(value) || (value.type !== 'text' && value.type !== 'json')) throw invalid('responseFormat')
  return { type: value.type }
}

const capOutputTokens = (value: unknown, maxOutputTokens: number): number => {
  if (value === undefined) return maxOutputTokens
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) throw invalid('maxOutputTokens')
  return Math.min(value, maxOutputTokens)
}

/**
 * Validates and reduces the model call to the forwarded options.
 * @param {unknown} call - The call sent by the browser.
 * @param {object} limits - Limits.
 * @param {number} limits.maxPromptChars - Max prompt size (chars).
 * @param {number} limits.maxOutputTokens - Max output tokens.
 * @returns {AiGatewayCall} The call to forward.
 */
export const sanitizeCall = (
  call: unknown,
  { maxPromptChars, maxOutputTokens }: { maxPromptChars: number; maxOutputTokens: number }
): AiGatewayCall => {
  if (!isObject(call)) throw invalid('call')
  if (call.tools !== undefined || call.toolChoice !== undefined) throw invalid('tools')
  const sanitized: AiGatewayCall = {
    prompt: sanitizePrompt(call.prompt, maxPromptChars),
    ...pickNumericOptions(call),
    maxOutputTokens: capOutputTokens(call.maxOutputTokens, maxOutputTokens),
  }
  const stopSequences = pickStopSequences(call.stopSequences)
  if (stopSequences) sanitized.stopSequences = stopSequences
  const responseFormat = pickResponseFormat(call.responseFormat)
  if (responseFormat) sanitized.responseFormat = responseFormat
  return sanitized
}
