/**
 * Incremental parser of `data:` server-sent events carrying JSON payloads, shared by the server
 * (vercel-ai-sdk provider) and the browser (gateway stream reader). Plus the v4 "unknown" usage / stop shapes.
 */
import type { LanguageModelV4FinishReason, LanguageModelV4Usage } from '@ai-sdk/provider'

import SystemError, { StatusCodes } from '@core/systemError'

const FRAME_DELIMITER = '\n\n'
const DATA_PREFIX = 'data:'
const DONE_TOKEN = '[DONE]'

export type SseParser = { push: (text: string) => void; end: () => void }

// no cap when absent; a frame is the text up to the next blank line
export type SseLimits = { maxFrameChars?: number; maxTotalChars?: number }

const tooLarge = () => new SystemError('aiProviderResponseTooLarge', {}, StatusCodes.BAD_GATEWAY)

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
 * @param {Function} [params.onDone] - Called once, on `[DONE]` (argument true) or at `end()` (false).
 * @param {SseLimits} [params.limits] - Caps on one frame and on the whole text; `push` throws
 *   aiProviderResponseTooLarge (502) when one is exceeded.
 * @returns {SseParser} The parser.
 */
export const createSseParser = ({
  onEvent,
  onDone,
  limits = {},
}: {
  onEvent: (event: unknown) => void
  onDone?: (receivedDoneToken: boolean) => void
  limits?: SseLimits
}): SseParser => {
  const { maxFrameChars = Infinity, maxTotalChars = Infinity } = limits
  // the text of the frame being received, as the chunks that arrived (never re-concatenated per push)
  let pending: string[] = []
  let pendingChars = 0
  let total = 0
  let terminated = false

  const terminate = (receivedDoneToken: boolean) => {
    if (terminated) return
    terminated = true
    onDone?.(receivedDoneToken)
  }

  const handleFrame = (frame: string) => {
    for (const line of frame.split('\n')) {
      if (terminated) return
      if (!line.startsWith(DATA_PREFIX)) continue
      const payload = line.slice(DATA_PREFIX.length).trim()
      if (payload === DONE_TOKEN) {
        terminate(true)
        return
      }
      const parsed = parseJson(payload)
      if (parsed.ok) onEvent(parsed.value)
    }
  }

  /**
   * Takes the frame made of the pending chunks plus the first `end` chars of `text` and handles it.
   * @param {string} text - The chunk being processed.
   * @param {number} end - Where the frame ends in the chunk (may be negative: the delimiter began in pending).
   */
  const flushFrame = (text: string, end: number) => {
    const head = pending.join('')
    const frame = end >= 0 ? head + text.slice(0, end) : head.slice(0, end)
    pending = []
    pendingChars = 0
    if (frame.length > maxFrameChars) throw tooLarge()
    handleFrame(frame)
  }

  const drain = (text: string) => {
    let start = 0
    // a delimiter split between two chunks: "\n" ended the pending text, "\n" starts this chunk
    if (pendingChars > 0 && text.startsWith('\n') && pending[pending.length - 1].endsWith('\n')) {
      flushFrame(text, -1)
      start = 1
    }
    let index = terminated ? -1 : text.indexOf(FRAME_DELIMITER, start)
    while (!terminated && index >= 0) {
      flushFrame(text.slice(start, index), index - start)
      start = index + FRAME_DELIMITER.length
      index = text.indexOf(FRAME_DELIMITER, start)
    }
    if (terminated || start >= text.length) return
    // what is left is the start of a frame that has not ended yet
    const rest = start > 0 ? text.slice(start) : text
    pending.push(rest)
    pendingChars += rest.length
    if (pendingChars > maxFrameChars) throw tooLarge()
  }

  return {
    push: (text: string) => {
      if (terminated || !text) return
      total += text.length
      if (total > maxTotalChars) throw tooLarge()
      drain(text)
    },
    end: () => {
      const tail = pending.join('')
      pending = []
      pendingChars = 0
      if (!terminated && tail.length > 0) handleFrame(tail)
      terminate(false)
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
