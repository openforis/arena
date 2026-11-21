import http from 'node:http'
import type { AddressInfo } from 'node:net'

import { buildUserModel } from '@server/modules/ai/service/providerRegistry'
import { toAiSystemError } from '@server/modules/ai/service/gateway/errorMapping'

const MIB = 1024 * 1024
const TOO_LARGE = 'aiProviderResponseTooLarge'
const callOptions = { prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }] } as any

type Kind = { provider: 'openai-compatible' | 'vercel-ai-sdk'; path: string; answerOf: (bytes: number) => string }

const KINDS: Kind[] = [
  {
    provider: 'openai-compatible',
    path: '/v1',
    answerOf: (bytes) =>
      `{"choices":[{"index":0,"message":{"role":"assistant","content":"${'a'.repeat(bytes)}"},"finish_reason":"stop"}]}`,
  },
  {
    provider: 'vercel-ai-sdk',
    path: '/chat',
    answerOf: (bytes) =>
      Array.from(
        { length: Math.ceil(bytes / 1000) },
        () => `data: {"type":"text-delta","delta":"${'a'.repeat(1000)}"}\n\n`
      )
        .concat('data: [DONE]\n\n')
        .join(''),
  },
]

/**
 * Returns what a call fails with, or undefined when it succeeds.
 * @param {PromiseLike<unknown>} call - The call.
 * @returns {Promise<any>} The error.
 */
const failureOf = (call: PromiseLike<unknown>): Promise<any> =>
  Promise.resolve(call).then(
    () => undefined,
    (error) => error
  )

describe('the response cap applies to the models built for a user endpoint, behind the connect-time guard (541)', () => {
  let server: http.Server
  let port: number
  let handler: (request: http.IncomingMessage, response: http.ServerResponse) => void
  let written: number
  let closed: Promise<void>

  const allowlist = () => [`http://127.0.0.1:${port}`]

  beforeAll(async () => {
    server = http.createServer((request, response) => {
      closed = new Promise((resolve) => response.on('close', () => resolve()))
      request.resume()
      request.on('end', () => handler(request, response))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    port = (server.address() as AddressInfo).port
  })

  afterAll(async () => {
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })

  beforeEach(() => {
    written = 0
    closed = Promise.resolve()
  })

  describe.each(KINDS)('$provider', ({ provider, path, answerOf }) => {
    const cfg = () => ({ provider, model: 'm', baseUrl: `http://127.0.0.1:${port}${path}`, apiKey: 'k' })

    test('an answer over the cap of the model is refused, though it is far below the cap of the guard', async () => {
      const body = answerOf(9 * MIB)
      handler = (_request, response) => {
        response.writeHead(200, { 'content-type': 'text/event-stream' })
        response.end(body)
      }
      const model = await buildUserModel(cfg(), { allowlist: allowlist() })
      expect(toAiSystemError(await failureOf(model.doGenerate(callOptions))).key).toBe(TOO_LARGE)
    })

    test('an answer under the cap passes', async () => {
      const body = answerOf(1 * MIB)
      handler = (_request, response) => {
        response.writeHead(200, { 'content-type': 'text/event-stream' })
        response.end(body)
      }
      const model = await buildUserModel(cfg(), { allowlist: allowlist() })
      expect(await failureOf(model.doGenerate(callOptions))).toBeUndefined()
    })

    test('an answer that declares a size over the cap is refused before it is read', async () => {
      handler = (_request, response) => {
        response.writeHead(200, { 'content-type': 'text/event-stream', 'content-length': String(500 * MIB) })
        // whole SSE frames, so that only the size of the answer can stop it
        const chunk = Buffer.from(`data: {"type":"text-delta","delta":"${'a'.repeat(1000)}"}\n\n`.repeat(64))
        const timer = setInterval(() => {
          written += chunk.length
          response.write(chunk)
        }, 1)
        response.on('close', () => clearInterval(timer))
      }
      const model = await buildUserModel(cfg(), { allowlist: allowlist() })
      expect(toAiSystemError(await failureOf(model.doGenerate(callOptions))).key).toBe(TOO_LARGE)
      await closed
      // the cap of the model refuses it at once; the cap of the guard (32 MiB) would read far more
      expect(written).toBeLessThan(4 * MIB)
    })

    test('the guard still refuses an address that is internal when the call connects', async () => {
      let lookups = 0
      // public for the check before the call, internal (DNS rebinding) for the connection
      const lookup = async () => {
        lookups += 1
        return [{ address: lookups === 1 ? '8.8.8.8' : '127.0.0.1', family: 4 }]
      }
      const model = await buildUserModel(
        { provider, model: 'm', baseUrl: `http://rebind.example:${port}${path}`, apiKey: 'k' },
        { allowlist: [], lookup }
      )
      const error = await failureOf(model.doGenerate(callOptions))
      expect(toAiSystemError(error).key).toBe('aiBaseUrlNotAllowed')
      expect(lookups).toBeGreaterThan(1)
    })
  })
})
