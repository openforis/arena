/**
 * Vercel AI SDK v5 `LanguageModelV2` adapter for any backend that speaks
 * the Vercel AI SDK v5 chat protocol — i.e. accepts a POST body of
 * `{ messages: [{ role, parts: [{type:'text', text}] }] }` and streams a
 * typed event protocol (`text-delta`, `reasoning-delta`, `data-title`, …)
 * over SSE.
 *
 * Caveats:
 *   - The endpoint is treated as a fixed agent: temperature, model
 *     selection, and (mostly) system prompts are ignored. The adapter
 *     prepends any system content to the first user message so it isn't
 *     lost entirely.
 *   - JSON / structured-output modes are not honored. `generateObject`
 *     will be best-effort at best and is liable to fail schema validation.
 *   - Token usage is not reported; the adapter returns the v2 "unknown"
 *     usage shape (undefined input/output/total tokens).
 */

import { AiProvider } from '@common/ai/aiProvider'

const DEFAULT_TIMEOUT_MS = 60000
const SSE_FRAME_DELIMITER = '\n\n'
const DATA_PREFIX = 'data:'

const unknownUsage = () => ({
  inputTokens: undefined,
  outputTokens: undefined,
  totalTokens: undefined,
})

/**
 * Streaming SSE parser for the AI SDK v5 protocol. Stateful across calls
 * so the caller can feed partial chunks from a fetch reader. Yields parsed
 * event objects via the `onEvent` callback in arrival order.
 *
 * Handles three subtleties of the v5 wire format:
 *   1. Multiple `data:` lines may appear in a single frame.
 *   2. Events may straddle chunk boundaries (buffered until `\n\n`).
 *   3. A terminal `data: [DONE]` is reported via `onDone`.
 * @param {object} args - Args.
 * @param {Function} args.onEvent - Called once per parsed event.
 * @param {Function} [args.onDone] - Called once when the stream terminates.
 * @returns {{push: Function, end: Function}} Parser handle.
 */
export const createV5StreamParser = ({ onEvent, onDone }) => {
  let buffer = ''
  let terminated = false

  const handlePayload = (payload) => {
    if (payload === '[DONE]') {
      terminated = true
      onDone?.()
      return
    }
    try {
      const event = JSON.parse(payload)
      onEvent?.(event)
    } catch {
      // Ignore non-JSON payloads.
    }
  }

  const drain = () => {
    let idx
    while (!terminated && (idx = buffer.indexOf(SSE_FRAME_DELIMITER)) >= 0) {
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + SSE_FRAME_DELIMITER.length)
      for (const line of frame.split('\n')) {
        if (!line.startsWith(DATA_PREFIX)) continue
        handlePayload(line.slice(DATA_PREFIX.length).trim())
        if (terminated) return
      }
    }
  }

  return {
    push: (text) => {
      if (terminated || !text) return
      buffer += text
      drain()
    },
    end: () => {
      if (terminated) return
      if (buffer.length > 0) {
        for (const line of buffer.split('\n')) {
          if (!line.startsWith(DATA_PREFIX)) continue
          handlePayload(line.slice(DATA_PREFIX.length).trim())
          if (terminated) return
        }
        buffer = ''
      }
      if (!terminated) {
        terminated = true
        onDone?.()
      }
    },
  }
}

/**
 * Flatten v5 prompt message content (string for system role, parts array
 * for others) into a plain text string.
 * @param {*} content - The message content.
 * @returns {string} Flattened text.
 */
const flattenContent = (content) => {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.map((part) => (part?.type === 'text' && typeof part.text === 'string' ? part.text : '')).join('')
}

const toV5Message = (role, text) => ({ role, parts: [{ type: 'text', text }] })

// Tool messages are skipped — no tool-calling in this adapter.
const partitionByRole = (prompt) => {
  const systemTexts = []
  const rest = []
  for (const msg of prompt) {
    if (!msg) continue
    const text = flattenContent(msg.content)
    if (!text) continue
    if (msg.role === 'system') systemTexts.push(text)
    else if (msg.role === 'user' || msg.role === 'assistant') rest.push({ role: msg.role, text })
  }
  return { systemTexts, rest }
}

const prependPreamble = (rest, preamble) => {
  const messages = []
  let preambleApplied = !preamble
  for (const m of rest) {
    const isFirstUser = !preambleApplied && m.role === 'user'
    const text = isFirstUser ? `${preamble}\n\n${m.text}` : m.text
    if (isFirstUser) preambleApplied = true
    messages.push(toV5Message(m.role, text))
  }
  if (!preambleApplied) messages.push(toV5Message('user', preamble))
  return messages
}

/**
 * Convert the Vercel AI SDK v5 `LanguageModelV2Prompt` array into the flat
 * shape the chat endpoint accepts. The protocol has no system role:
 * all system content is joined and prepended to the first user message.
 * @param {Array} prompt - The v5 prompt array.
 * @returns {Array} v5-chat messages with `parts` arrays.
 */
const vercelAiSdkMessagesFromPrompt = (prompt) => {
  if (!Array.isArray(prompt)) return []
  const { systemTexts, rest } = partitionByRole(prompt)
  const preamble = systemTexts.join('\n\n').trim()
  return prependPreamble(rest, preamble)
}

/**
 * POST a v5 message array to the chat endpoint and return the raw Response.
 * Caller is responsible for reading the body and aborting.
 * @param {object} args - Args.
 * @param {string} args.endpoint - The chat endpoint URL.
 * @param {Array} args.messages - Validated v5 messages.
 * @param {AbortSignal} args.signal - Abort signal.
 * @returns {Promise<Response>} The fetch Response handle.
 */
const postChatEndpoint = async ({ endpoint, messages, signal }) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ messages }),
    signal,
  })
  if (!response.ok || !response.body) {
    const bodyText = response.ok ? '' : await response.text().catch(() => '')
    throw new Error(`AI SDK upstream HTTP ${response.status}${bodyText ? `: ${bodyText.slice(0, 500)}` : ''}`)
  }
  return response
}

/**
 * Consume the v5 SSE stream end-to-end and return the concatenated body
 * text. `text-delta` events accumulate into the answer; reasoning frames
 * are ignored for non-streaming generation.
 * @param {Response} response - The fetch Response.
 * @param {AbortSignal} signal - Abort signal for the read loop.
 * @returns {Promise<string>} The full response text.
 */
const drainChatStreamToText = async (response, signal) => {
  let text = ''
  const parser = createV5StreamParser({
    onEvent: (event) => {
      if (event?.type === 'text-delta') {
        const delta = typeof event.delta === 'string' ? event.delta : event.text
        if (typeof delta === 'string') text += delta
      } else if (event?.type === 'error') {
        const msg = typeof event.errorText === 'string' ? event.errorText : 'AI SDK error'
        throw new Error(msg)
      }
    },
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    if (signal?.aborted) break

    const { value, done } = await reader.read()
    if (done) break
    parser.push(decoder.decode(value, { stream: true }))
  }
  parser.end()
  return text
}

/**
 * Build a v5 `LanguageModelV2`-shaped handle for a Vercel AI SDK v5 chat
 * endpoint.
 * @param {object} cfg - Config.
 * @param {string} cfg.baseUrl - Chat endpoint URL.
 * @param {number} [cfg.timeoutMs] - Per-request timeout. Defaults to 60s.
 * @returns {object} A model handle compatible with `generateText` / `streamText`.
 */
export const createVercelAiSdkModel = ({ baseUrl, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  const endpoint = baseUrl
  const provider = AiProvider.vercelAiSdk
  const modelId = AiProvider.vercelAiSdk

  const linkSignals = (externalSignal) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    if (externalSignal) {
      if (externalSignal.aborted) controller.abort()
      else externalSignal.addEventListener('abort', () => controller.abort(), { once: true })
    }
    return {
      signal: controller.signal,
      cleanup: () => clearTimeout(timeout),
    }
  }

  return {
    specificationVersion: 'v2',
    provider,
    modelId,
    supportedUrls: {},

    async doGenerate(options) {
      const { signal, cleanup } = linkSignals(options.abortSignal)
      try {
        const messages = vercelAiSdkMessagesFromPrompt(options.prompt)
        const response = await postChatEndpoint({ endpoint, messages, signal })
        const text = await drainChatStreamToText(response, signal)
        return {
          content: [{ type: 'text', text }],
          finishReason: 'stop',
          usage: unknownUsage(),
          warnings: [],
        }
      } finally {
        cleanup()
      }
    },

    async doStream(options) {
      const { signal, cleanup } = linkSignals(options.abortSignal)
      const messages = vercelAiSdkMessagesFromPrompt(options.prompt)
      const response = await postChatEndpoint({ endpoint, messages, signal })
      const textBlockId = 'vercel-ai-sdk-text'

      const stream = new ReadableStream({
        async start(controller) {
          let textStarted = false
          const parser = createV5StreamParser({
            onEvent: (event) => {
              if (event?.type === 'text-delta') {
                const delta = typeof event.delta === 'string' ? event.delta : event.text
                if (typeof delta === 'string' && delta.length > 0) {
                  if (!textStarted) {
                    controller.enqueue({ type: 'text-start', id: textBlockId })
                    textStarted = true
                  }
                  controller.enqueue({ type: 'text-delta', id: textBlockId, delta })
                }
              } else if (event?.type === 'error') {
                const msg = typeof event.errorText === 'string' ? event.errorText : 'AI SDK error'
                controller.enqueue({ type: 'error', error: new Error(msg) })
              }
            },
            onDone: () => {
              if (textStarted) controller.enqueue({ type: 'text-end', id: textBlockId })
              controller.enqueue({
                type: 'finish',
                finishReason: 'stop',
                usage: unknownUsage(),
              })
              controller.close()
            },
          })
          controller.enqueue({ type: 'stream-start', warnings: [] })
          try {
            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            while (true) {
              if (signal.aborted) break

              const { value, done } = await reader.read()
              if (done) break
              parser.push(decoder.decode(value, { stream: true }))
            }
            parser.end()
          } catch (error) {
            controller.enqueue({ type: 'error', error })
            controller.close()
          } finally {
            cleanup()
          }
        },
      })

      return { stream }
    },
  }
}

export { vercelAiSdkMessagesFromPrompt }
