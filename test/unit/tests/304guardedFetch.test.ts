import http from 'node:http'
import type { AddressInfo } from 'node:net'

import { assertBaseUrlAllowed } from '@server/modules/ai/service/baseUrlGuard'
import { createGuardedFetch } from '@server/modules/ai/service/guardedFetch'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

type Seen = { method?: string; url?: string; headers: http.IncomingHttpHeaders; body: string }

/**
 * Builds a DNS lookup (promise style, as the guard takes it) that answers the addresses of each call in turn; the last
 * answer is repeated.
 * @param {...string[]} answers - One list of addresses per call.
 * @returns {Function} The lookup, with the number of calls on `calls`.
 */
const lookupAnswering = (...answers: string[][]) => {
  let calls = 0
  const lookup: any = async () => {
    const addresses = answers[Math.min(calls, answers.length - 1)]
    calls += 1
    return addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }))
  }
  Object.defineProperty(lookup, 'calls', { get: () => calls })
  return lookup as ((...args: unknown[]) => Promise<{ address: string; family: number }[]>) & { calls: number }
}

describe('guarded fetch (304)', () => {
  let server: http.Server
  let port: number
  let seen: Seen[]
  let connections: number
  let handler: (request: http.IncomingMessage, response: http.ServerResponse) => void

  const baseUrl = () => `http://127.0.0.1:${port}`

  beforeAll(async () => {
    server = http.createServer((request, response) => {
      const chunks: Buffer[] = []
      request.on('data', (chunk) => chunks.push(chunk))
      request.on('end', () => {
        seen.push({
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: Buffer.concat(chunks).toString(),
        })
        handler(request, response)
      })
    })
    server.on('connection', () => {
      connections += 1
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    port = (server.address() as AddressInfo).port
  })

  afterAll(async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })

  beforeEach(() => {
    seen = []
    connections = 0
    handler = (_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ ok: true }))
    }
  })

  test('a name that resolves to an internal address when the socket connects is refused, with no connection', async () => {
    const lookup = lookupAnswering(['10.0.0.5'])
    const guardedFetch = createGuardedFetch({ allowlist: [], lookup })
    await expectSystemErrorKey(guardedFetch(`http://llm.attacker.example:${port}/v1/models`), 'aiBaseUrlNotAllowed')
    expect(connections).toBe(0)
    // one blocked address among allowed ones is enough to refuse
    const mixed = createGuardedFetch({ allowlist: [], lookup: lookupAnswering(['93.184.216.34', '127.0.0.1']) })
    await expectSystemErrorKey(mixed(`http://llm.attacker.example:${port}/`), 'aiBaseUrlNotAllowed')
    expect(connections).toBe(0)
  })

  test('DNS rebinding: the pre-check sees a public address, the connection would go to a loopback one', async () => {
    const lookup = lookupAnswering(['93.184.216.34'], ['127.0.0.1'])
    const url = `http://rebind.attacker.example:${port}/v1`
    await assertBaseUrlAllowed(url, { allowlist: [], lookup: lookup as any })
    expect(lookup.calls).toBe(1)
    await expectSystemErrorKey(createGuardedFetch({ allowlist: [], lookup })(url), 'aiBaseUrlNotAllowed')
    expect(lookup.calls).toBe(2)
    expect(connections).toBe(0)
  })

  test('an internal IP address as the host is refused unless the server is on the allowlist', async () => {
    const guardedFetch = createGuardedFetch({ allowlist: [], lookup: lookupAnswering(['127.0.0.1']) })
    for (const url of [
      baseUrl(),
      `http://[::1]:${port}/`,
      `http://[::ffff:7f00:1]:${port}/`,
      'http://169.254.169.254/',
    ]) {
      await expectSystemErrorKey(guardedFetch(url), 'aiBaseUrlNotAllowed')
    }
    expect(connections).toBe(0)
    await expectSystemErrorKey(guardedFetch('file:///etc/passwd'), 'aiBaseUrlNotAllowed')
    const allowed = createGuardedFetch({ allowlist: [baseUrl()] })
    expect((await allowed(`${baseUrl()}/v1/models`)).status).toBe(200)
    expect(connections).toBe(1)
  })

  test('an allowlisted name is resolved by the system without the address check; any other name by the guarded lookup', async () => {
    const lookup = lookupAnswering(['127.0.0.1'])
    const allowed = createGuardedFetch({ allowlist: [`http://llm.internal.test:${port}`] })
    // the system resolver does not know the name: the connection fails, it is not refused as an internal address
    await expect(allowed(`http://llm.internal.test:${port}/`)).rejects.toThrow('fetch failed')
    const guarded = createGuardedFetch({ allowlist: [], lookup })
    await expectSystemErrorKey(guarded(`http://llm.other.test:${port}/`), 'aiBaseUrlNotAllowed')
    expect(lookup.calls).toBe(1)
  })

  test('requests carry the method, headers and body; the response has its status, headers and body', async () => {
    handler = (_request, response) => {
      response.writeHead(404, 'Nope', {
        'content-type': 'application/json',
        'x-one': '1',
        'set-cookie': ['a=1', 'b=2'],
      })
      response.end(JSON.stringify({ error: 'missing' }))
    }
    const guardedFetch = createGuardedFetch({ allowlist: [baseUrl()] })
    const response = await guardedFetch(`${baseUrl()}/v1/chat/completions?x=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer k' },
      body: JSON.stringify({ hello: 'wörld' }),
    })
    expect(seen[0]).toMatchObject({ method: 'POST', url: '/v1/chat/completions?x=1', body: '{"hello":"wörld"}' })
    expect(seen[0].headers).toMatchObject({ authorization: 'Bearer k', 'content-type': 'application/json' })
    expect(seen[0].headers['content-length']).toBe(String(Buffer.byteLength('{"hello":"wörld"}')))
    expect(response.status).toBe(404)
    expect(response.ok).toBe(false)
    expect(response.statusText).toBe('Nope')
    expect(response.headers.get('x-one')).toBe('1')
    expect(response.headers.getSetCookie()).toEqual(['a=1', 'b=2'])
    expect(await response.json()).toEqual({ error: 'missing' })
  })

  test('a response body is streamed, and a status without a body has none', async () => {
    handler = (_request, response) => {
      response.writeHead(200, { 'content-type': 'text/event-stream' })
      response.write('data: one\n\n')
      setTimeout(() => response.end('data: two\n\n'), 30)
    }
    const guardedFetch = createGuardedFetch({ allowlist: [baseUrl()] })
    const response = await guardedFetch(`${baseUrl()}/stream`)
    const chunks: string[] = []
    const reader = response.body!.getReader()
    for (let read = await reader.read(); !read.done; read = await reader.read()) {
      chunks.push(new TextDecoder().decode(read.value))
    }
    expect(chunks.join('')).toBe('data: one\n\ndata: two\n\n')
    handler = (_request, res) => {
      res.writeHead(204)
      res.end()
    }
    const empty = await guardedFetch(`${baseUrl()}/empty`)
    expect(empty.status).toBe(204)
    expect(empty.body).toBeNull()
  })

  test('a redirect is refused, and what it points to is never requested', async () => {
    handler = (_request, response) => {
      response.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data' })
      response.end()
    }
    const guardedFetch = createGuardedFetch({ allowlist: [baseUrl()] })
    await expect(guardedFetch(`${baseUrl()}/v1/models`)).rejects.toMatchObject({
      message: 'fetch failed',
      cause: { message: 'unexpected redirect' },
    })
    expect(seen).toHaveLength(1)
  })

  test('an abort rejects with the reason of the signal, before the response and while the body is read', async () => {
    const guardedFetch = createGuardedFetch({ allowlist: [baseUrl()] })
    handler = () => undefined // never answers
    await expect(guardedFetch(`${baseUrl()}/slow`, { signal: AbortSignal.timeout(50) })).rejects.toMatchObject({
      name: 'TimeoutError',
    })
    const controller = new AbortController()
    controller.abort(new Error('stop'))
    await expect(guardedFetch(`${baseUrl()}/slow`, { signal: controller.signal })).rejects.toThrow('stop')
    // the headers arrive, the body does not: the read fails with the timeout
    handler = (_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.write('{"data":')
    }
    const response = await guardedFetch(`${baseUrl()}/partial`, { signal: AbortSignal.timeout(100) })
    await expect(response.text()).rejects.toMatchObject({ name: 'TimeoutError' })
  })

  test('a connection failure is a TypeError "fetch failed", like fetch', async () => {
    const closed = http.createServer()
    await new Promise<void>((resolve) => closed.listen(0, '127.0.0.1', resolve))
    const closedPort = (closed.address() as AddressInfo).port
    await new Promise((resolve) => closed.close(resolve))
    const guardedFetch = createGuardedFetch({ allowlist: [`http://127.0.0.1:${closedPort}`] })
    await expect(guardedFetch(`http://127.0.0.1:${closedPort}/`)).rejects.toBeInstanceOf(TypeError)
  })

  test('a body that cannot be sent as bytes is refused', async () => {
    const guardedFetch = createGuardedFetch({ allowlist: [baseUrl()] })
    await expect(guardedFetch(baseUrl(), { method: 'POST', body: new Blob(['x']) })).rejects.toThrow(TypeError)
    expect(seen).toEqual([])
  })
})
