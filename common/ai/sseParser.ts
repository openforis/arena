/**
 * Incremental parser of `data:` server-sent events carrying JSON payloads, shared by the server
 * (vercel-ai-sdk provider) and the browser (gateway stream reader). Plus the v4 "unknown" usage / stop shapes.
 */
import type { LanguageModelV4FinishReason, LanguageModelV4Usage } from '@ai-sdk/provider'

const FRAME_DELIMITER = '\n\n'
const DATA_PREFIX = 'data:'
const DONE_TOKEN = '[DONE]'

export type SseParser = { push: (text: string) => void; end: () => void }

const parseJson = (payload: string): { ok: boolean; value?: unknown } => {
  try {
    return { ok: true, value: JSON.parse(payload) }
  } catch {
    return { ok: false }
  }
}

/**
 * Creates a stateful parser fed with decoded text chunks.
 * @param {object} params - Parameters.
 * @param {Function} params.onEvent - Called with each JSON payload; errors it throws propagate to the caller.
 * @param {Function} [params.onDone] - Called once, on `[DONE]` or at `end()`.
 * @returns {SseParser} The parser.
 */
export const createSseParser = ({
  onEvent,
  onDone,
}: {
  onEvent: (event: unknown) => void
  onDone?: () => void
}): SseParser => {
  let buffer = ''
  let terminated = false

  const terminate = () => {
    if (terminated) return
    terminated = true
    onDone?.()
  }

  const handleFrame = (frame: string) => {
    for (const line of frame.split('\n')) {
      if (terminated) return
      if (!line.startsWith(DATA_PREFIX)) continue
      const payload = line.slice(DATA_PREFIX.length).trim()
      if (payload === DONE_TOKEN) {
        terminate()
        return
      }
      const parsed = parseJson(payload)
      if (parsed.ok) onEvent(parsed.value)
    }
  }

  const drain = () => {
    let index = buffer.indexOf(FRAME_DELIMITER)
    while (!terminated && index >= 0) {
      const frame = buffer.slice(0, index)
      buffer = buffer.slice(index + FRAME_DELIMITER.length)
      handleFrame(frame)
      index = buffer.indexOf(FRAME_DELIMITER)
    }
  }

  return {
    push: (text: string) => {
      if (terminated || !text) return
      buffer += text
      drain()
    },
    end: () => {
      if (!terminated && buffer.length > 0) handleFrame(buffer)
      buffer = ''
      terminate()
    },
  }
}

/**
 * Usage for providers that don't report tokens.
 * @returns {LanguageModelV4Usage} All counts undefined.
 */
export const unknownUsageV4 = (): LanguageModelV4Usage => ({
  inputTokens: { total: undefined, noCache: undefined, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: undefined, text: undefined, reasoning: undefined },
})

/**
 * Finish reason of a normally completed answer.
 * @returns {LanguageModelV4FinishReason} The `stop` finish reason.
 */
export const stopFinishReason = (): LanguageModelV4FinishReason => ({ unified: 'stop', raw: undefined })
