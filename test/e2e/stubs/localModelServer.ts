/**
 * OpenAI-compatible stub of a local AI server (LM Studio) for the e2e specs: CORS on, the LM Studio model list,
 * and chat completions answered by the mock provider (A's canned answers and the D1/D2 scripted turns).
 * It records every request so a spec can check what reached it.
 */
import http, { type IncomingMessage, type ServerResponse } from 'http'
import type { AddressInfo } from 'net'

import type {
  LanguageModelV4CallOptions,
  LanguageModelV4Content,
  LanguageModelV4FunctionTool,
  LanguageModelV4Message,
  LanguageModelV4Prompt,
  LanguageModelV4StreamPart,
} from '@ai-sdk/provider'

import { createMockModel } from '@server/modules/ai/service/mockProvider'

export const STUB_MODEL_ID = 'local-model'
export const STUB_CONTEXT_TOKENS = 8192

export type LocalModelServerRequest = { method: string; path: string; body: unknown }

export type LocalModelServerStub = {
  baseUrl: string
  modelId: string
  requests: LocalModelServerRequest[]
  stop: () => Promise<void>
}

type OpenAiToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } }
type OpenAiMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | { type: string; text?: string }[] | null
  tool_calls?: OpenAiToolCall[]
  tool_call_id?: string
}
type OpenAiTool = { type: 'function'; function: { name: string; description?: string; parameters?: object } }
type OpenAiChatRequest = { messages?: OpenAiMessage[]; tools?: OpenAiTool[]; stream?: boolean }

const textOf = (content: OpenAiMessage['content']): string => {
  if (typeof content === 'string') return content
  return Array.isArray(content) ? content.map((part) => part.text ?? '').join('') : ''
}

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const toAssistantMessage = (message: OpenAiMessage, toolNames: Map<string, string>): LanguageModelV4Message => {
  const text = textOf(message.content)
  const toolCalls = (message.tool_calls ?? []).map((call) => {
    toolNames.set(call.id, call.function.name)
    return {
      type: 'tool-call' as const,
      toolCallId: call.id,
      toolName: call.function.name,
      input: parseJson(call.function.arguments),
    }
  })
  return { role: 'assistant', content: [...(text ? [{ type: 'text' as const, text }] : []), ...toolCalls] }
}

const toToolMessage = (message: OpenAiMessage, toolNames: Map<string, string>): LanguageModelV4Message => {
  const value = parseJson(textOf(message.content))
  const toolCallId = message.tool_call_id ?? ''
  return {
    role: 'tool',
    content: [
      {
        type: 'tool-result',
        toolCallId,
        toolName: toolNames.get(toolCallId) ?? '',
        output: typeof value === 'string' ? { type: 'text', value } : { type: 'json', value: value as never },
      },
    ],
  }
}

/**
 * Converts OpenAI chat messages back to the prompt the mock model reads.
 * @param {OpenAiMessage[]} messages - Request messages.
 * @returns {LanguageModelV4Prompt} The prompt.
 */
export const toMockPrompt = (messages: OpenAiMessage[]): LanguageModelV4Prompt => {
  const toolNames = new Map<string, string>()
  return messages.map((message): LanguageModelV4Message => {
    if (message.role === 'system') return { role: 'system', content: textOf(message.content) }
    if (message.role === 'assistant') return toAssistantMessage(message, toolNames)
    if (message.role === 'tool') return toToolMessage(message, toolNames)
    return { role: 'user', content: [{ type: 'text', text: textOf(message.content) }] }
  })
}

const toMockTools = (tools: OpenAiTool[] | undefined): LanguageModelV4FunctionTool[] | undefined =>
  tools?.map((tool) => ({
    type: 'function',
    name: tool.function.name,
    description: tool.function.description,
    inputSchema: (tool.function.parameters ?? { type: 'object' }) as LanguageModelV4FunctionTool['inputSchema'],
  }))

const toOpenAiToolCall = (part: { toolCallId: string; toolName: string; input: string }): OpenAiToolCall => ({
  id: part.toolCallId,
  type: 'function',
  function: { name: part.toolName, arguments: part.input },
})

const USAGE = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }

/**
 * Returns the non-streamed chat completion body of the mock model's answer.
 * @param {LanguageModelV4Content[]} content - Mock answer.
 * @returns {object} OpenAI chat completion.
 */
export const toChatCompletion = (content: LanguageModelV4Content[]) => {
  const text = content.map((part) => (part.type === 'text' ? part.text : '')).join('')
  const toolCalls = content.flatMap((part) => (part.type === 'tool-call' ? [toOpenAiToolCall(part)] : []))
  return {
    id: 'chatcmpl-stub',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: STUB_MODEL_ID,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: text || null, ...(toolCalls.length ? { tool_calls: toolCalls } : {}) },
        finish_reason: toolCalls.length ? 'tool_calls' : 'stop',
      },
    ],
    usage: USAGE,
  }
}

const chunk = (delta: object, finishReason: string | null = null) => ({
  id: 'chatcmpl-stub',
  object: 'chat.completion.chunk',
  created: Math.floor(Date.now() / 1000),
  model: STUB_MODEL_ID,
  choices: [{ index: 0, delta, finish_reason: finishReason }],
})

/**
 * Returns the SSE chunks (without the final [DONE]) of the mock model's streamed answer.
 * @param {LanguageModelV4StreamPart[]} parts - Mock stream parts.
 * @returns {object[]} OpenAI chat completion chunks.
 */
export const toChatCompletionChunks = (parts: LanguageModelV4StreamPart[]): object[] => {
  const chunks: object[] = [chunk({ role: 'assistant', content: '' })]
  let toolCallIndex = 0
  for (const part of parts) {
    if (part.type === 'text-delta') chunks.push(chunk({ content: part.delta }))
    if (part.type === 'tool-call') {
      chunks.push(chunk({ tool_calls: [{ index: toolCallIndex, ...toOpenAiToolCall(part) }] }))
      toolCallIndex += 1
    }
  }
  chunks.push(chunk({}, toolCallIndex > 0 ? 'tool_calls' : 'stop'))
  chunks.push({ ...chunk({}), choices: [], usage: USAGE })
  return chunks
}

const readStream = async <T>(stream: ReadableStream<T>): Promise<T[]> => {
  const parts: T[] = []
  const reader = stream.getReader()
  for (let next = await reader.read(); !next.done; next = await reader.read()) parts.push(next.value)
  return parts
}

const MODELS_V1 = { object: 'list', data: [{ id: STUB_MODEL_ID, object: 'model', owned_by: 'organization_owner' }] }
const MODELS_LM_STUDIO = {
  object: 'list',
  data: [
    {
      id: STUB_MODEL_ID,
      object: 'model',
      type: 'llm',
      state: 'loaded',
      loaded_context_length: STUB_CONTEXT_TOKENS,
      max_context_length: 32768,
    },
  ],
}

const setCors = (req: IncomingMessage, res: ServerResponse): void => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] ?? 'content-type')
  // Chrome's private/local network access preflight
  if (req.headers['access-control-request-private-network'])
    res.setHeader('Access-Control-Allow-Private-Network', 'true')
}

const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

const readBody = async (req: IncomingMessage): Promise<unknown> => {
  const buffers: Buffer[] = []
  for await (const data of req) buffers.push(data as Buffer)
  const text = Buffer.concat(buffers).toString('utf8')
  return text ? parseJson(text) : null
}

const answerChat = async (res: ServerResponse, request: OpenAiChatRequest): Promise<void> => {
  const model = createMockModel()
  const options = {
    prompt: toMockPrompt(request.messages ?? []),
    tools: toMockTools(request.tools),
  } as LanguageModelV4CallOptions
  if (!request.stream) {
    const result = await model.doGenerate(options)
    sendJson(res, 200, toChatCompletion(result.content))
    return
  }
  const { stream } = await model.doStream(options)
  const chunks = toChatCompletionChunks(await readStream(stream))
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' })
  for (const data of chunks) res.write(`data: ${JSON.stringify(data)}\n\n`)
  res.end('data: [DONE]\n\n')
}

const handle = async (
  req: IncomingMessage,
  res: ServerResponse,
  requests: LocalModelServerRequest[]
): Promise<void> => {
  setCors(req, res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  const path = (req.url ?? '/').split('?')[0]
  const body = req.method === 'POST' ? await readBody(req) : null
  requests.push({ method: req.method ?? 'GET', path, body })

  if (req.method === 'GET' && path === '/v1/models') return sendJson(res, 200, MODELS_V1)
  if (req.method === 'GET' && path === '/api/v0/models') return sendJson(res, 200, MODELS_LM_STUDIO)
  if (req.method === 'POST' && path === '/v1/chat/completions') return answerChat(res, body as OpenAiChatRequest)
  sendJson(res, 404, { error: { message: `Unexpected endpoint or method. (${req.method} ${path})` } })
}

/**
 * Starts the stub on 127.0.0.1 (a free port unless one is given).
 * @param {object} [params] - Parameters.
 * @param {number} [params.port] - Port (default: any free port).
 * @returns {Promise<LocalModelServerStub>} Base URL (`…/v1`), model id, recorded requests and `stop()`.
 */
export const startLocalModelServer = async ({ port = 0 }: { port?: number } = {}): Promise<LocalModelServerStub> => {
  const requests: LocalModelServerRequest[] = []
  const server = http.createServer((req, res) => {
    handle(req, res, requests).catch((error: Error) => {
      if (!res.headersSent) sendJson(res, 500, { error: { message: error.message } })
      else res.end()
    })
  })
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve))
  const { port: actualPort } = server.address() as AddressInfo
  return {
    baseUrl: `http://127.0.0.1:${actualPort}/v1`,
    modelId: STUB_MODEL_ID,
    requests,
    stop: () =>
      new Promise<void>((resolve) => {
        // the browser keeps connections alive: close them, or close() waits for them
        server.closeAllConnections()
        server.close(() => resolve())
      }),
  }
}
