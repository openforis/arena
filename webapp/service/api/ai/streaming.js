/**
 * Server-Sent Events helper used by streaming AI features (#3 expression
 * explainer, #5 activity-log summary).
 *
 * Implemented over `fetch` + `ReadableStream` rather than the browser's
 * native `EventSource` because Arena authenticates every request with a
 * JWT bearer token (set by the axios interceptor in
 * `webapp/app/appErrorsMiddleware.js`), and `EventSource` cannot send
 * custom headers — so SSE GET routes guarded by `requireLoggedInUser`
 * always 401 when opened with `new EventSource(url)`.
 *
 * Wire format expected from the server (unchanged from the original
 * EventSource contract):
 *   - `data: { "chunk": "..." }\n\n` — text chunk
 *   - `data: { "error": "..." }\n\n` — server-side error
 *   - `data: [DONE]\n\n` — clean close
 */
import { ApiConstants } from '@webapp/service/api/utils/apiConstants'

const SSE_FRAME_DELIMITER = '\n\n'
const DATA_PREFIX = 'data:'
const DONE_TOKEN = '[DONE]'

/**
 * Dispatch a single parsed `data:` payload to the right handler.
 * @param {string} payload - Trimmed payload after the `data:` prefix.
 * @param {object} handlers - User-supplied callbacks.
 * @param handlers.onChunk
 * @param handlers.onDone
 * @param handlers.onError
 * @param handlers.onReasoning
 * @param handlers.onTitle
 * @returns {boolean} True when the payload terminates the stream.
 */
const dispatchPayload = (payload, { onChunk, onDone, onError, onReasoning, onTitle }) => {
  if (payload === DONE_TOKEN) {
    onDone?.()
    return true
  }
  let parsed
  try {
    parsed = JSON.parse(payload)
  } catch (err) {
    onError?.(err)
    return true
  }
  if (parsed?.error) {
    onError?.(new Error(parsed.error))
    return true
  }
  if (parsed?.chunk !== undefined) onChunk?.(parsed.chunk)
  else if (parsed?.text !== undefined) onChunk?.(parsed.text)
  if (parsed?.reasoning !== undefined) onReasoning?.(parsed.reasoning)
  if (parsed?.title !== undefined) onTitle?.(parsed.title)
  return false
}

/**
 * Drain complete SSE frames from `buffer`, dispatching each one. Returns
 * the trailing partial frame plus a flag indicating whether the stream
 * has been terminated by a payload (e.g. `[DONE]` or an error event).
 * @param {string} buffer - Accumulated decoded text since the last drain.
 * @param {object} handlers - User-supplied callbacks.
 * @returns {{ remainder: string, terminated: boolean }} Drain result.
 */
const drainFrames = (buffer, handlers) => {
  let remainder = buffer
  let terminated = false
  let idx
  while (!terminated && (idx = remainder.indexOf(SSE_FRAME_DELIMITER)) >= 0) {
    const frame = remainder.slice(0, idx)
    remainder = remainder.slice(idx + SSE_FRAME_DELIMITER.length)
    for (const line of frame.split('\n')) {
      if (!line.startsWith(DATA_PREFIX)) continue
      const payload = line.slice(DATA_PREFIX.length).trim()
      if (dispatchPayload(payload, handlers)) {
        terminated = true
        break
      }
    }
  }
  return { remainder, terminated }
}

/**
 * Read the response body and try to extract the server's translation key
 * from a JSON `{ error }` envelope. Returns null on any failure so the
 * caller can fall back to the HTTP status text.
 * @param {Response} response - Failed fetch response.
 * @returns {Promise<?string>} Translation key, or null.
 */
const parseErrorKey = async (response) => {
  let bodyText = ''
  try {
    bodyText = await response.text()
  } catch {
    return null
  }
  try {
    const parsed = JSON.parse(bodyText)
    return parsed?.error || null
  } catch {
    return null
  }
}

/**
 * Drive the SSE reader loop on a successful response, dispatching frames
 * to `handlers` until the server closes the stream, the consumer cancels,
 * or a terminal frame (`[DONE]` / error) is observed.
 * @param {Response} response - Successful fetch response.
 * @param {object} handlers - Same shape as `streamSse`'s handlers.
 * @param {{ cancelled: boolean }} state - Shared cancellation flag.
 * @param {Function} cancel - Cancel callback (invoked on terminal frame).
 * @returns {Promise<void>} Resolves when the loop ends.
 */
const pumpResponse = async (response, handlers, state, cancel) => {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (!state.cancelled) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const drained = drainFrames(buffer, handlers)
    buffer = drained.remainder
    if (drained.terminated) {
      cancel()
      return
    }
  }
  // Server closed the stream without an explicit [DONE] marker — treat
  // as a clean finish so the panel stops the spinner.
  if (!state.cancelled) handlers.onDone?.()
}

const makeCanceller = () => {
  const controller = new AbortController()
  const state = { cancelled: false }
  const cancel = () => {
    if (state.cancelled) return
    state.cancelled = true
    controller.abort()
  }
  return { controller, state, cancel }
}

const authHeaders = (extra = {}) => {
  const token = ApiConstants.getAuthToken()
  return {
    ...extra,
    Accept: 'text/event-stream',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/**
 * Opens an authenticated SSE-over-fetch connection and forwards `data:`
 * events to the supplied callbacks. Returns a `cancel` function the
 * caller MUST invoke to abort the underlying request when the consumer
 * tears down (component unmount, panel close, etc.).
 * @param {string} url - The streaming endpoint URL (relative to host).
 * @param {object} handlers - Callback handlers.
 * @param {Function} handlers.onChunk - Called with each parsed text chunk.
 * @param {Function} [handlers.onError] - Called on transport / parse / server error.
 * @param {Function} [handlers.onDone] - Called when the server closes the stream cleanly.
 * @returns {Function} A cancel function that aborts the fetch and stops dispatching events.
 */
export const streamSse = (url, handlers = {}) => {
  const { controller, state, cancel } = makeCanceller()

  const run = async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: authHeaders(),
        signal: controller.signal,
        credentials: 'same-origin',
      })
      if (!response.ok) {
        handlers.onError?.(new Error(`HTTP ${response.status} ${response.statusText || ''}`.trim()))
        return
      }
      if (!response.body) {
        handlers.onError?.(new Error('Streaming response has no body'))
        return
      }
      await pumpResponse(response, handlers, state, cancel)
    } catch (err) {
      if (state.cancelled || err?.name === 'AbortError') return
      handlers.onError?.(err)
    }
  }

  run()
  return cancel
}

/**
 * POST variant of `streamSse`. Same wire format and same callback shape,
 * but sends a JSON body — used by the documentation chatbot, where the
 * conversation history is too large for a query string.
 * @param {string} url - The streaming endpoint URL.
 * @param {*} body - JSON-serialisable request body.
 * @param {object} handlers - Same handler shape as `streamSse`, plus
 *   optional `onReasoning(text)` and `onTitle(text)` for the chatbot.
 * @returns {Function} A cancel function.
 */
export const streamSsePost = (url, body, handlers = {}) => {
  const { controller, state, cancel } = makeCanceller()

  const run = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
        signal: controller.signal,
        credentials: 'same-origin',
      })
      if (!response.ok) {
        const errorKey = await parseErrorKey(response)
        handlers.onError?.(new Error(errorKey || `HTTP ${response.status} ${response.statusText || ''}`.trim()))
        return
      }
      if (!response.body) {
        handlers.onError?.(new Error('Streaming response has no body'))
        return
      }
      await pumpResponse(response, handlers, state, cancel)
    } catch (err) {
      if (state.cancelled || err?.name === 'AbortError') return
      handlers.onError?.(err)
    }
  }

  run()
  return cancel
}
