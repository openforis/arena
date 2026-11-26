type SseResponse = {
  setHeader: (name: string, value: string) => void
  flushHeaders?: () => void
  // false when the socket buffer is full (wait for `drain`)
  write: (chunk: string) => boolean | void
  end: () => void
  writableEnded?: boolean
  destroyed?: boolean
  once?: (event: string, listener: () => void) => unknown
  off?: (event: string, listener: () => void) => unknown
}

/**
 * Sends the SSE headers (no buffering by proxies).
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
 * @returns {Function} Writer taking the data to send; it answers false when the socket buffer is full.
 */
export const createSseEventWriter =
  (res: SseResponse) =>
  (data: unknown): boolean =>
    res.write(`data: ${JSON.stringify(data)}\n\n`) !== false

/**
 * Waits until the socket buffer has room again; it also resolves when the client goes away or the signal aborts, so
 * a client that never reads cannot hold the call.
 * @param {AbortSignal} [signal] - Aborted when the call is cancelled (timeout).
 */
export const waitForDrain = (res: SseResponse, signal?: AbortSignal): Promise<void> => {
  if (isSseClosed(res) || signal?.aborted || !res.once) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const finish = () => {
      res.off?.('drain', finish)
      res.off?.('close', finish)
      signal?.removeEventListener('abort', finish)
      resolve()
    }
    res.once('drain', finish)
    res.once('close', finish)
    signal?.addEventListener('abort', finish, { once: true })
  })
}

/**
 * Writes the `[DONE]` frame and ends the response.
 */
export const closeSseStream = (res: SseResponse): void => {
  res.write('data: [DONE]\n\n')
  res.end()
}

/**
 * Returns true when nothing can be written any more (response ended or client gone).
 */
export const isSseClosed = (res: SseResponse): boolean => !!res.writableEnded || !!res.destroyed
