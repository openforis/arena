/**
 * Validation of the gateway request (feature, data class, survey) and sanitising of the forwarded model
 * call: text-only prompt (plus tool calls and results for tool features), function tools for tool features
 * only, no files/provider options, capped output, bounded prompt size.
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

const TOOL_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/
const MAX_TOOLS = 32
const MAX_TOOL_DESCRIPTION_CHARS = 4000
const TOOL_CHOICE_TYPES = new Set(['auto', 'none', 'required'])

export type SanitizeLimits = { maxPromptChars: number; maxOutputTokens: number; allowTools?: boolean }

type GatewayTool = { type: 'function'; name: string; description?: string; inputSchema: Record<string, any> }

const jsonSize = (value: unknown): number => JSON.stringify(value ?? null).length

const isTextPart = (part: unknown): part is Record<string, any> =>
  isObject(part) && part.type === 'text' && typeof part.text === 'string'

const isReasoningPart = (part: unknown): part is Record<string, any> =>
  isObject(part) && part.type === 'reasoning' && typeof part.text === 'string'

const isToolPartOf = (part: unknown, type: string): part is Record<string, any> =>
  isObject(part) &&
  part.type === type &&
  typeof part.toolCallId === 'string' &&
  typeof part.toolName === 'string' &&
  TOOL_NAME_PATTERN.test(part.toolName)

// Rebuilds a tool result output from the known keys of its type; null when the output is not supported.
const rebuildToolOutput = (output: unknown): Record<string, any> | null => {
  if (!isObject(output)) return null
  const { type, value, reason } = output
  if (type === 'text' || type === 'error-text') return typeof value === 'string' ? { type, value } : null
  if (type === 'json' || type === 'error-json') return value === undefined ? null : { type, value }
  if (type === 'execution-denied') return typeof reason === 'string' ? { type, reason } : { type }
  return null
}

// Rebuilds each part from the known keys of its type (providerOptions and any other key are dropped);
// null when the part is not allowed in a message of this role.
const rebuildPart = (part: unknown, role: string, allowTools: boolean): Record<string, any> | null => {
  if (isTextPart(part)) return role === 'tool' ? null : { type: 'text', text: part.text }
  if (!allowTools || role === 'user') return null
  if (role === 'assistant') {
    if (isReasoningPart(part)) return { type: 'reasoning', text: part.text }
    if (isToolPartOf(part, 'tool-call')) {
      return { type: 'tool-call', toolCallId: part.toolCallId, toolName: part.toolName, input: part.input }
    }
    return null
  }
  if (!isToolPartOf(part, 'tool-result')) return null
  const output = rebuildToolOutput(part.output)
  return output && { type: 'tool-result', toolCallId: part.toolCallId, toolName: part.toolName, output }
}

// Rebuilds the message from { role, content } so that extra keys, e.g. providerOptions, are dropped.
// System content is a string; user content text parts; assistant and tool content depend on allowTools.
const rebuildMessage = (message: unknown, allowTools: boolean): any => {
  if (!isObject(message)) throw invalid('prompt')
  const { role, content } = message
  if (role === 'system') {
    if (typeof content !== 'string') throw invalid('prompt.system')
    return { role, content }
  }
  const roleAllowed = role === 'user' || role === 'assistant' || (role === 'tool' && allowTools)
  if (!roleAllowed) throw invalid('prompt.role')
  if (!Array.isArray(content)) throw invalid('prompt.content')
  const parts = content.map((part) => rebuildPart(part, role, allowTools))
  if (!parts.every(Boolean)) throw invalid('prompt.content')
  return { role, content: parts }
}

const partSize = (part: Record<string, any>): number => {
  if (part.type === 'tool-call') return jsonSize(part.input)
  if (part.type === 'tool-result') return jsonSize(part.output)
  return part.text.length
}

const messageSize = (message: any): number =>
  typeof message.content === 'string'
    ? message.content.length
    : message.content.reduce((total: number, part: any) => total + partSize(part), 0)

const sanitizePrompt = (
  prompt: unknown,
  { maxPromptChars, allowTools, extraSize }: { maxPromptChars: number; allowTools: boolean; extraSize: number }
): AiGatewayCall['prompt'] => {
  if (!Array.isArray(prompt) || prompt.length === 0) throw invalid('prompt')
  const rebuilt = prompt.map((message) => rebuildMessage(message, allowTools))
  const size = rebuilt.reduce((total, message) => total + messageSize(message), extraSize)
  if (size > maxPromptChars) {
    throw new SystemError('aiPromptTooLarge', { size, limit: maxPromptChars }, PAYLOAD_TOO_LARGE)
  }
  return rebuilt
}

const checkTool = (tool: unknown): GatewayTool => {
  if (!isObject(tool) || tool.type !== 'function') throw invalid('tools')
  const { name, description, inputSchema } = tool
  if (typeof name !== 'string' || !TOOL_NAME_PATTERN.test(name)) throw invalid('tools.name')
  const descriptionValid =
    description === undefined || (typeof description === 'string' && description.length <= MAX_TOOL_DESCRIPTION_CHARS)
  if (!descriptionValid) throw invalid('tools.description')
  if (!isObject(inputSchema)) throw invalid('tools.inputSchema')
  return description === undefined
    ? { type: 'function', name, inputSchema }
    : { type: 'function', name, description, inputSchema }
}

const pickTools = (value: unknown, allowTools: boolean): GatewayTool[] | undefined => {
  if (value === undefined) return undefined
  if (!allowTools || !Array.isArray(value) || value.length > MAX_TOOLS) throw invalid('tools')
  const tools = value.map(checkTool)
  if (new Set(tools.map((tool) => tool.name)).size !== tools.length) throw invalid('tools.name')
  return tools.length > 0 ? tools : undefined
}

const pickToolChoice = (value: unknown, tools: GatewayTool[] | undefined): AiGatewayCall['toolChoice'] => {
  if (value === undefined) return undefined
  if (!tools || !isObject(value)) throw invalid('toolChoice')
  if (TOOL_CHOICE_TYPES.has(value.type)) return { type: value.type }
  if (value.type === 'tool' && tools.some((tool) => tool.name === value.toolName)) {
    return { type: 'tool', toolName: value.toolName }
  }
  throw invalid('toolChoice')
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
 * @param {SanitizeLimits} limits - Limits; `allowTools` only for features flagged `tools`.
 * @returns {AiGatewayCall} The call to forward.
 */
export const sanitizeCall = (
  call: unknown,
  { maxPromptChars, maxOutputTokens, allowTools = false }: SanitizeLimits
): AiGatewayCall => {
  if (!isObject(call)) throw invalid('call')
  const tools = pickTools(call.tools, allowTools)
  const toolChoice = pickToolChoice(call.toolChoice, tools)
  const sanitized: AiGatewayCall = {
    prompt: sanitizePrompt(call.prompt, { maxPromptChars, allowTools, extraSize: tools ? jsonSize(tools) : 0 }),
    ...pickNumericOptions(call),
    maxOutputTokens: capOutputTokens(call.maxOutputTokens, maxOutputTokens),
  }
  const stopSequences = pickStopSequences(call.stopSequences)
  if (stopSequences) sanitized.stopSequences = stopSequences
  const responseFormat = pickResponseFormat(call.responseFormat)
  if (responseFormat) sanitized.responseFormat = responseFormat
  if (tools) sanitized.tools = tools as AiGatewayCall['tools']
  if (toolChoice) sanitized.toolChoice = toolChoice
  return sanitized
}
