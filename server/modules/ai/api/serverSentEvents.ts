type SseResponse = {
  setHeader: (name: string, value: string) => void
  flushHeaders?: () => void
  write: (chunk: string) => void
  end: () => void
}

export const openSseStream = (res: SseResponse): void => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()
}

export const createSseEventWriter =
  (res: SseResponse) =>
  (data: unknown): void => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

export const closeSseStream = (res: SseResponse): void => {
  res.write('data: [DONE]\n\n')
  res.end()
}
