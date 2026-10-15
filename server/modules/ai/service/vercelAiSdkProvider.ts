/**
 * `LanguageModelV4` adapter for a backend speaking the AI SDK chat protocol: POST
 * `{ messages: [{ role, parts: [{ type: 'text', text }] }] }`, typed SSE answer (`text-delta`, `error`, …).
 *
 * The endpoint is a fixed agent: model selection, temperature and JSON mode are ignored, system content is
 * prepended to the first user message, token usage is unknown.
 */
import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4Prompt,
  LanguageModelV4StreamPart,
} from '@ai-sdk/provider'

import SystemError, { StatusCodes } from '@core/systemError'
import { AiProvider } from '@common/ai/aiProvider'
import { AiLimits } from '@common/ai/limits'
import { createSseParser, stopFinishReason, unknownUsageV4 } from '@common/ai/sseParser'

import { readTextCapped } from './responseLimits'

const DEFAULT_TIMEOUT_MS = 60000
const ERROR_BODY_MESSAGE_CHARS = 500
const TEXT_ID = 'vercel-ai-sdk-text'

type ChatMessage = { role: 'user' | 'assistant'; parts: { type: 'text'; text: string }[] }
type FetchImpl = (url: string, init: RequestInit) => Promise<Response>

export type VercelAiSdkLimits = { maxResponseBytes?: number; maxFrameChars?: number; maxErrorBodyBytes?: number }
type ResolvedLimits = Required<VercelAiSdkLimits>

const resolveLimits = (limits: VercelAiSdkLimits): ResolvedLimits => ({
  maxResponseBytes: AiLimits.providerResponseMaxBytes,
  maxFrameChars: AiLimits.providerFrameMaxChars,
  maxErrorBodyBytes: AiLimits.providerErrorBodyMaxBytes,
  ...limits,
})

const flattenContent = (content: unknown): string => {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.map((part) => (part?.type === 'text' && typeof part.text === 'string' ? part.text : '')).join('')
}

const toChatMessage = (role: ChatMessage['role'], text: string): ChatMessage => ({
  role,
  parts: [{ type: 'text', text }],
})

// tool messages are skipped: no tool calling in this adapter
const partitionByRole = (prompt: LanguageModelV4Prompt) => {
  const systemTexts: string[] = []
  const rest: { role: ChatMessage['role']; text: string }[] = []
  for (const message of prompt) {
    const text = flattenContent(message?.content)
    if (!text) continue
    if (message.role === 'system') systemTexts.push(text)
    else if (message.role === 'user' || message.role === 'assistant') rest.push({ role: message.role, text })
  }
  return { systemTexts, rest }
}

const prependPreamble = (rest: { role: ChatMessage['role']; text: string }[], preamble: string): ChatMessage[] => {
  const messages: ChatMessage[] = []
  let preambleApplied = !preamble
  for (const message of rest) {
    const isFirstUser = !preambleApplied && message.role === 'user'
    messages.push(toChatMessage(message.role, isFirstUser ? `${preamble}\n\n${message.text}` : message.text))
    if (isFirstUser) preambleApplied = true
  }
  if (!preambleApplied) messages.push(toChatMessage('user', preamble))
  return messages
}

/**
 * Converts the AI SDK prompt into chat messages; system content is prepended to the first user message.
 * @param {LanguageModelV4Prompt} prompt - The prompt.
 * @returns {ChatMessage[]} The chat messages.
 */
export const vercelAiSdkMessagesFromPrompt = (prompt: LanguageModelV4Prompt): ChatMessage[] => {
  if (!Array.isArray(prompt)) return []
  const { systemTexts, rest } = partitionByRole(prompt)
  return prependPreamble(rest, systemTexts.join('\n\n').trim())
}

const getDelta = (event: any): string | null => {
  const delta = typeof event?.delta === 'string' ? event.delta : event?.text
  return typeof delta === 'string' && delta.length > 0 ? delta : null
}

const getErrorText = (event: any): string =>
  typeof event?.errorText === 'string' ? event.errorText : 'AI SDK upstream error'

// one AbortController per call: aborted by the caller's signal, the timeout or a stream cancel
const createCallAbort = (externalSignal: AbortSignal | undefined, timeoutMs: number) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new Error('AI SDK upstream timeout')), timeoutMs)
  const onExternalAbort = () => controller.abort(externalSignal?.reason)
  if (externalSignal?.aborted) controller.abort(externalSignal.reason)
  else externalSignal?.addEventListener('abort', onExternalAbort, { once: true })
  return {
    signal: controller.signal,
    abort: (reason?: unknown) => controller.abort(reason),
    cleanup: () => {
      clearTimeout(timer)
      externalSignal?.removeEventListener('abort', onExternalAbort)
    },
  }
}

const postChat = async ({
  fetchImpl,
  endpoint,
  options,
  signal,
  maxErrorBodyBytes,
}: {
  fetchImpl: FetchImpl
  endpoint: string
  options: LanguageModelV4CallOptions
  signal: AbortSignal
  maxErrorBodyBytes: number
}): Promise<Response> => {
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ messages: vercelAiSdkMessagesFromPrompt(options.prompt) }),
    signal,
    redirect: 'error', // a redirect would bypass the base URL guard
  })
  if (!response.ok || !response.body) {
    const bodyText = response.ok ? '' : await readTextCapped(response, maxErrorBodyBytes).catch(() => '')
    const detail = bodyText ? `: ${bodyText.slice(0, ERROR_BODY_MESSAGE_CHARS)}` : ''
    throw new Error(`AI SDK upstream HTTP ${response.status}${detail}`)
  }
  return response
}

const readAll = async ({
  response,
  onText,
  signal,
  maxBytes,
}: {
  response: Response
  onText: (text: string) => void
  signal: AbortSignal
  maxBytes: number
}): Promise<void> => {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let received = 0
  // cancelling the reader unblocks a pending read when the call is aborted
  const onAbort = () => reader.cancel(signal.reason).catch(() => undefined)
  signal.addEventListener('abort', onAbort, { once: true })
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read()
      if (done) break
      received += value.byteLength
      if (received > maxBytes) throw new SystemError('aiProviderResponseTooLarge', {}, StatusCodes.BAD_GATEWAY)
      onText(decoder.decode(value, { stream: true }))
    }
    // an abort (timeout, caller) must not look like a complete answer
    if (signal.aborted) throw signal.reason
  } catch (error) {
    // the endpoint must not keep sending to a call that failed here
    await reader.cancel(error).catch(() => undefined)
    throw error
  } finally {
    signal.removeEventListener('abort', onAbort)
    reader.releaseLock()
  }
}

const incompleteStreamError = () => new SystemError('aiProviderUnavailable', {}, StatusCodes.BAD_GATEWAY)

const generateFullText = async ({
  response,
  signal,
  limits,
}: {
  response: Response
  signal: AbortSignal
  limits: ResolvedLimits
}): Promise<string> => {
  let text = ''
  let completed = false
  const parser = createSseParser({
    onEvent: (event: any) => {
      if (event?.type === 'error') throw new Error(getErrorText(event))
      if (event?.type === 'finish') completed = true
      if (event?.type === 'text-delta') text += getDelta(event) ?? ''
    },
    onDone: (receivedDoneToken) => {
      if (receivedDoneToken) completed = true
    },
    limits: { maxFrameChars: limits.maxFrameChars },
  })
  await readAll({ response, onText: parser.push, signal, maxBytes: limits.maxResponseBytes })
  parser.end()
  // upstream closing without [DONE] / finish means a truncated answer
  if (!completed) throw incompleteStreamError()
  return text
}

const createPartsStream = ({
  response,
  call,
  limits,
}: {
  response: Response
  call: ReturnType<typeof createCallAbort>
  limits: ResolvedLimits
}): ReadableStream<LanguageModelV4StreamPart> => {
  let closed = false
  return new ReadableStream<LanguageModelV4StreamPart>({
    async start(controller) {
      let textStarted = false
      let completed = false
      let failed = false
      const enqueue = (part: LanguageModelV4StreamPart) => {
        if (!closed) controller.enqueue(part)
      }
      const close = () => {
        if (closed) return
        closed = true
        controller.close()
      }
      const parser = createSseParser({
        onEvent: (event: any) => {
          if (event?.type === 'error') {
            failed = true
            enqueue({ type: 'error', error: new Error(getErrorText(event)) })
            return
          }
          if (event?.type === 'finish') completed = true
          const delta = event?.type === 'text-delta' ? getDelta(event) : null
          if (!delta) return
          if (!textStarted) enqueue({ type: 'text-start', id: TEXT_ID })
          textStarted = true
          enqueue({ type: 'text-delta', id: TEXT_ID, delta })
        },
        onDone: (receivedDoneToken) => {
          if (receivedDoneToken) completed = true
        },
        limits: { maxFrameChars: limits.maxFrameChars },
      })
      enqueue({ type: 'stream-start', warnings: [] })
      try {
        await readAll({ response, onText: parser.push, signal: call.signal, maxBytes: limits.maxResponseBytes })
        parser.end()
        if (completed && !failed) {
          if (textStarted) enqueue({ type: 'text-end', id: TEXT_ID })
          enqueue({ type: 'finish', finishReason: stopFinishReason(), usage: unknownUsageV4() })
        } else if (!completed) {
          // closed without [DONE] / finish: a truncated answer must not look complete
          enqueue({ type: 'error', error: incompleteStreamError() })
        }
      } catch (error) {
        enqueue({ type: 'error', error })
      } finally {
        call.cleanup()
        close()
      }
    },
    cancel(reason) {
      closed = true
      call.abort(reason)
      call.cleanup()
    },
  })
}

/**
 * Builds the model handle for an AI SDK chat endpoint.
 * @param {object} cfg - Config.
 * @param {string} cfg.baseUrl - Chat endpoint URL.
 * @param {number} [cfg.timeoutMs] - Per-call timeout (default 60s).
 * @param {FetchImpl} [cfg.fetchImpl] - Fetch implementation (tests).
 * @param {VercelAiSdkLimits} [cfg.limits] - Caps on the answer (default: AiLimits.provider*).
 * @returns {LanguageModelV4} The model.
 */
export const createVercelAiSdkModel = ({
  baseUrl,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = (url, init) => fetch(url, init),
  limits: limitsOverride = {},
}: {
  baseUrl: string
  timeoutMs?: number
  fetchImpl?: FetchImpl
  limits?: VercelAiSdkLimits
}): LanguageModelV4 => {
  const limits = resolveLimits(limitsOverride)
  return {
    specificationVersion: 'v4',
    provider: AiProvider.vercelAiSdk,
    modelId: AiProvider.vercelAiSdk,
    supportedUrls: {},

    async doGenerate(options) {
      const call = createCallAbort(options.abortSignal, timeoutMs)
      try {
        const response = await postChat({
          fetchImpl,
          endpoint: baseUrl,
          options,
          signal: call.signal,
          maxErrorBodyBytes: limits.maxErrorBodyBytes,
        })
        const text = await generateFullText({ response, signal: call.signal, limits })
        return {
          content: [{ type: 'text', text }],
          finishReason: stopFinishReason(),
          usage: unknownUsageV4(),
          warnings: [],
        }
      } catch (error) {
        call.abort(error) // closes the upstream connection on any failure
        throw error
      } finally {
        call.cleanup()
      }
    },

    async doStream(options) {
      const call = createCallAbort(options.abortSignal, timeoutMs)
      try {
        const response = await postChat({
          fetchImpl,
          endpoint: baseUrl,
          options,
          signal: call.signal,
          maxErrorBodyBytes: limits.maxErrorBodyBytes,
        })
        return { stream: createPartsStream({ response, call, limits }) }
      } catch (error) {
        call.cleanup()
        throw error
      }
    },
  }
}
