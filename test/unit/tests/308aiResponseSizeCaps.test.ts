import { ENV } from '@core/processUtils'
import * as AiProviderService from '@server/modules/ai/service/aiProviderService'
import { createGuardedFetch } from '@server/modules/ai/service/guardedFetch'
import * as ModelDiscovery from '@server/modules/ai/service/modelDiscovery'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { createTestHttpServer } from '@test/unit/utils/testHttpServer'

const MIB = 1024 * 1024
// the time the test allows for a call that the byte cap must have stopped (a stream with no end)
const PROMPT_MS = 3000

describe('the size of what an endpoint of a user sends is capped (308)', () => {
  const server = createTestHttpServer()
  const originalAllowlist = ENV.aiOrgHostedBaseUrls
  const deps = AiProviderService.createDefaultAiProviderServiceDeps()
  const cfg = () => ({
    provider: 'openai-compatible',
    model: 'm',
    baseUrl: `http://127.0.0.1:${server.port}/v1`,
    apiKey: 'k',
  })

  /**
   * Answers with the status and a body that never ends (until the client closes the connection).
   * @param {number} status - Status of the answer.
   * @param {Record<string, string>} [headers] - More headers.
   * @returns {void}
   */
  const answerForever = (status: number, headers: Record<string, string> = {}) => {
    server.handler = (_request, response) => {
      response.writeHead(status, { 'content-type': 'application/json', ...headers })
      const chunk = Buffer.alloc(64 * 1024, 'a')
      const timer = setInterval(() => response.write(chunk), 1)
      response.on('close', () => clearInterval(timer))
    }
  }

  /**
   * Answers with the status and the body.
   * @param {number} status - Status of the answer.
   * @param {string} body - Body of the answer.
   * @returns {void}
   */
  const answer = (status: number, body: string) => {
    server.handler = (_request, response) => {
      response.writeHead(status, { 'content-type': 'application/json' })
      response.end(body)
    }
  }

  /**
   * Builds a model list whose JSON has about the size.
   * @param {number} bytes - Size of the JSON.
   * @returns {string} The JSON.
   */
  const modelListOf = (bytes: number) => {
    const entry = (n: number) => `{"id":"model-${String(n).padStart(8, '0')}"}`
    const count = Math.floor(bytes / (entry(0).length + 1))
    return `{"data":[${Array.from({ length: count }, (_value, n) => entry(n)).join(',')}]}`
  }

  beforeAll(async () => {
    await server.start()
    ENV.aiOrgHostedBaseUrls = [`http://127.0.0.1:${server.port}`]
  })

  afterAll(async () => {
    ENV.aiOrgHostedBaseUrls = originalAllowlist
    await server.stop()
  })

  beforeEach(() => {
    server.closedRequests = 0
  })

  describe('the model list', () => {
    test('a large list is read', async () => {
      answer(200, modelListOf(MIB))
      const models = await deps.listModels(cfg())
      expect(models.length).toBeGreaterThan(10000)
    })

    test('a list over the cap is refused', async () => {
      answer(200, modelListOf(3 * MIB))
      const error: any = await expectSystemErrorKey(deps.listModels(cfg()), 'aiProviderResponseTooLarge')
      expect(error.statusCode).toBe(502)
    })

    test('a body that never ends is cut at the cap and the connection is closed', async () => {
      answerForever(200)
      const start = Date.now()
      await expectSystemErrorKey(deps.listModels(cfg()), 'aiProviderResponseTooLarge')
      expect(Date.now() - start).toBeLessThan(PROMPT_MS)
      await server.untilClientClosed(PROMPT_MS)
    })

    test('a declared size over the cap is refused before the body is read', async () => {
      server.handler = (_request, response) => {
        response.writeHead(200, { 'content-type': 'application/json', 'content-length': String(500 * MIB) })
        response.write('{"data":[')
      }
      const start = Date.now()
      await expectSystemErrorKey(deps.listModels(cfg()), 'aiProviderResponseTooLarge')
      expect(Date.now() - start).toBeLessThan(PROMPT_MS)
      await server.untilClientClosed(PROMPT_MS)
    })

    test('the body of an error is not read: a body that never ends does not hold the call', async () => {
      answerForever(500)
      const start = Date.now()
      await expectSystemErrorKey(deps.listModels(cfg()), 'aiModelListFailed')
      expect(Date.now() - start).toBeLessThan(PROMPT_MS)
      await server.untilClientClosed(PROMPT_MS)
    })
  })

  describe('the connection test', () => {
    test('an answer that never ends is cut and fails as "unavailable", and the connection is closed', async () => {
      answerForever(200)
      const start = Date.now()
      const result = await deps.runTest({ user: { uuid: 'u1' } as any, cfg: cfg() })
      expect(result).toMatchObject({ ok: false, errorKey: 'aiProviderUnavailable' })
      expect(Date.now() - start).toBeLessThan(PROMPT_MS)
      await server.untilClientClosed(PROMPT_MS)
    })

    test('an error answer that never ends is cut too', async () => {
      answerForever(429)
      const start = Date.now()
      const result = await deps.runTest({ user: { uuid: 'u1' } as any, cfg: cfg() })
      expect(result).toMatchObject({ ok: false })
      expect(Date.now() - start).toBeLessThan(PROMPT_MS)
      await server.untilClientClosed(PROMPT_MS)
    })
  })

  describe('the guarded fetch', () => {
    test('a body over its cap fails the read, and the connection is closed', async () => {
      answerForever(200)
      const guardedFetch = createGuardedFetch({ allowlist: ENV.aiOrgHostedBaseUrls, maxBodyBytes: 100_000 })
      const response = await guardedFetch(`http://127.0.0.1:${server.port}/x`)
      await expect(response.text()).rejects.toBeDefined()
      await server.untilClientClosed(PROMPT_MS)
    })

    test('the body of an error is cut at 64 KiB, far below the cap of a success', async () => {
      answer(500, 'e'.repeat(100 * 1024))
      const guardedFetch = createGuardedFetch({ allowlist: ENV.aiOrgHostedBaseUrls })
      const response = await guardedFetch(`http://127.0.0.1:${server.port}/x`)
      await expect(response.text()).rejects.toBeDefined()
      await server.untilClientClosed(PROMPT_MS)
    })

    test('an error body of 60 KiB is read whole', async () => {
      answer(500, 'e'.repeat(60 * 1024))
      const guardedFetch = createGuardedFetch({ allowlist: ENV.aiOrgHostedBaseUrls })
      const response = await guardedFetch(`http://127.0.0.1:${server.port}/x`)
      expect(await response.text()).toHaveLength(60 * 1024)
    })

    test('a call with no signal times out, and one with a signal keeps its own', async () => {
      server.handler = () => undefined
      const guardedFetch = createGuardedFetch({ allowlist: ENV.aiOrgHostedBaseUrls, timeoutMs: 50 })
      const start = Date.now()
      await expect(guardedFetch(`http://127.0.0.1:${server.port}/x`)).rejects.toMatchObject({ name: 'TimeoutError' })
      expect(Date.now() - start).toBeLessThan(PROMPT_MS)
      const controller = new AbortController()
      const own = guardedFetch(`http://127.0.0.1:${server.port}/x`, { signal: controller.signal })
      setTimeout(() => controller.abort(new Error('mine')), 150)
      await expect(own).rejects.toThrow('mine')
    })

    test('a body within its cap is read whole', async () => {
      answer(200, 'a'.repeat(50_000))
      const guardedFetch = createGuardedFetch({ allowlist: ENV.aiOrgHostedBaseUrls, maxBodyBytes: 100_000 })
      const response = await guardedFetch(`http://127.0.0.1:${server.port}/x`)
      expect(await response.text()).toHaveLength(50_000)
    })

    test('a list is capped whatever fetch brings it (the cloud providers use the global fetch)', async () => {
      const fetchImpl = async () => new Response(modelListOf(3 * MIB), { status: 200 })
      await expectSystemErrorKey(
        ModelDiscovery.listForProvider(
          { provider: 'openai-compatible', baseUrl: `http://127.0.0.1:${server.port}/v1`, apiKey: 'k' },
          { allowlist: ENV.aiOrgHostedBaseUrls, fetchImpl } as any
        ),
        'aiProviderResponseTooLarge'
      )
    })
  })
})
