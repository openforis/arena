type SseResponse = {
  setHeader: (name: string, value: string) => void
  flushHeaders?: () => void
  write: (chunk: string) => void
  end: () => void
  writableEnded?: boolean
  destroyed?: boolean
}

/**
 * Sends the SSE headers (no buffering by proxies).
 * @param {SseResponse} res - Express response.
 */
export const openSseStream = (res: SseResponse): void => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()
}

/**
 * Returns a function writing one JSON `data:` frame.
 * @param {SseResponse} res - Express response.
 * @returns {Function} Writer taking the data to send.
 */
export const createSseEventWriter =
  (res: SseResponse) =>
  (data: unknown): void => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

/**
 * Writes the `[DONE]` frame and ends the response.
 * @param {SseResponse} res - Express response.
 */
export const closeSseStream = (res: SseResponse): void => {
  res.write('data: [DONE]\n\n')
  res.end()
}

/**
 * Returns true when nothing can be written any more (response ended or client gone).
 * @param {SseResponse} res - Express response.
 * @returns {boolean} True when closed.
 */
export const isSseClosed = (res: SseResponse): boolean => !!res.writableEnded || !!res.destroyed
