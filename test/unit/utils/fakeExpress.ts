import { EventEmitter } from 'node:events'

/**
 * Minimal Express response double: records status, JSON body, headers and SSE writes; emits `close`.
 * @returns {object} The fake response.
 */
export const createFakeResponse = () => {
  const res: any = new EventEmitter()
  Object.assign(res, {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined,
    writes: [] as string[],
    headersSent: false,
    writableEnded: false,
    destroyed: false,
    status(code: number) {
      res.statusCode = code
      return res
    },
    setHeader(name: string, value: string) {
      res.headers[name.toLowerCase()] = value
    },
    flushHeaders() {
      res.headersSent = true
    },
    json(body: unknown) {
      res.body = body
      res.headersSent = true
      res.end()
      return res
    },
    send(body: unknown) {
      return res.json(body)
    },
    write(chunk: string) {
      res.headersSent = true
      res.writes.push(chunk)
      return true
    },
    end() {
      if (res.writableEnded) return
      res.writableEnded = true
      res.emit('finish')
      res.emit('close')
    },
    // simulates the browser going away in the middle of the response
    disconnect() {
      res.destroyed = true
      res.emit('close')
    },
  })
  return res
}

/**
 * Parses the SSE frames written to a fake response.
 * @param {object} res - Fake response.
 * @returns {Array} The JSON payloads, plus '[DONE]' when present.
 */
export const parseSseWrites = (res: { writes: string[] }) =>
  res.writes
    .join('')
    .split('\n\n')
    .filter(Boolean)
    .map((frame) => frame.replace(/^data: /, ''))
    .map((payload) => (payload === '[DONE]' ? payload : JSON.parse(payload)))

/**
 * Minimal Express request double.
 * @param {object} body - Request body.
 * @returns {object} The fake request.
 */
export const createFakeRequest = (body: unknown) => {
  const req: any = new EventEmitter()
  req.body = body
  req.query = {}
  req.params = {}
  return req
}
