import http from 'node:http'
import type { AddressInfo } from 'node:net'

import { ENV } from '@core/processUtils'
import * as AiProviderService from '@server/modules/ai/service/aiProviderService'
import * as ModelDiscovery from '@server/modules/ai/service/modelDiscovery'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const UPSTREAM_SECRET = 'upstream said: key sk-live-123 is invalid for db.corp.local'

const CHAT_COMPLETION = JSON.stringify({
  id: 'chatcmpl-1',
  object: 'chat.completion',
  created: 1,
  model: 'm',
  choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
})

describe('calls to the endpoint of a user send error keys only (305)', () => {
  let server: http.Server
  let port: number
  let closedPort: number
  let requests: string[]
  let handler: (request: http.IncomingMessage, response: http.ServerResponse) => void
  const originalAllowlist = ENV.aiOrgHostedBaseUrls
  const deps = AiProviderService.createDefaultAiProviderServiceDeps()

  const orgServers = () => [`http://127.0.0.1:${port}`, `http://127.0.0.1:${closedPort}`]
  const baseUrl = () => `http://127.0.0.1:${port}/v1`
  const cfg = () => ({ provider: 'openai-compatible', model: 'm', baseUrl: baseUrl(), apiKey: 'k' })
  const answer = (status: number, body: string) => {
    handler = (_request, response) => {
      response.writeHead(status, { 'content-type': 'application/json' })
      response.end(body)
    }
  }

  beforeAll(async () => {
    server = http.createServer((request, response) => {
      requests.push(`${request.method} ${request.url}`)
      handler(request, response)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    port = (server.address() as AddressInfo).port
    // a port nobody listens on, to get a refused connection
    const unused = http.createServer()
    await new Promise<void>((resolve) => unused.listen(0, '127.0.0.1', resolve))
    closedPort = (unused.address() as AddressInfo).port
    await new Promise((resolve) => unused.close(resolve))
    // the test servers are on a loopback address: they are organisation servers
    ENV.aiOrgHostedBaseUrls = orgServers()
  })

  afterAll(async () => {
    ENV.aiOrgHostedBaseUrls = originalAllowlist
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })

  beforeEach(() => {
    requests = []
    answer(200, CHAT_COMPLETION)
  })

  describe('the connection test', () => {
    test('a working endpoint passes', async () => {
      expect(await deps.runTest({ user: { uuid: 'u1' } as any, cfg: cfg() })).toMatchObject({ ok: true })
      expect(requests).toEqual(['POST /v1/chat/completions'])
    })

    test('an upstream failure is a key (and no text), whatever the endpoint answered', async () => {
      const failures: [number, string][] = [
        [401, 'aiProviderAuth'],
        [403, 'aiProviderAuth'],
        [429, 'aiProviderRateLimited'],
        [400, 'aiProviderRejected'],
        [404, 'aiProviderRejected'],
        [500, 'aiProviderUnavailable'],
        [503, 'aiProviderUnavailable'],
      ]
      for (const [status, key] of failures) {
        answer(status, JSON.stringify({ error: { message: UPSTREAM_SECRET } }))
        const result = await deps.runTest({ user: { uuid: 'u1' } as any, cfg: cfg() })
        expect(result).toEqual({ ok: false, latencyMs: expect.any(Number), errorKey: key, errorParams: {} })
        expect(JSON.stringify(result)).not.toContain('db.corp.local')
      }
    })

    test('a connection failure, an answer that is not a completion and a redirect are "unavailable"', async () => {
      answer(200, `not json ${UPSTREAM_SECRET}`)
      const notJson = await deps.runTest({ user: { uuid: 'u1' } as any, cfg: cfg() })
      handler = (_request, response) => {
        response.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data' })
        response.end()
      }
      const redirected = await deps.runTest({ user: { uuid: 'u1' } as any, cfg: cfg() })
      const refused = await deps.runTest({
        user: { uuid: 'u1' } as any,
        cfg: { ...cfg(), baseUrl: `http://127.0.0.1:${closedPort}/v1` },
      })
      for (const result of [notJson, redirected, refused]) {
        expect(result).toMatchObject({ ok: false, errorKey: 'aiProviderUnavailable' })
        expect(JSON.stringify(result)).not.toContain('db.corp.local')
      }
      expect(requests).toEqual(['POST /v1/chat/completions', 'POST /v1/chat/completions'])
    })

    test('an internal address that is not an organisation server is refused with its key', async () => {
      ENV.aiOrgHostedBaseUrls = []
      try {
        const result = await deps.runTest({ user: { uuid: 'u1' } as any, cfg: cfg() })
        expect(result).toMatchObject({ ok: false, errorKey: 'aiBaseUrlNotAllowed' })
        expect(requests).toEqual([])
      } finally {
        ENV.aiOrgHostedBaseUrls = orgServers()
      }
    })
  })

  describe('the model list', () => {
    test('a list is read through the guarded fetch', async () => {
      answer(200, JSON.stringify({ data: [{ id: 'm1' }, { id: 'text-embedding-x' }] }))
      expect(await deps.listModels(cfg())).toEqual([{ id: 'm1' }, { id: 'text-embedding-x' }])
      expect(requests).toEqual(['GET /v1/models'])
    })

    test('an upstream failure is a key and a status code, with no text of the upstream', async () => {
      const failures: [number, string, number][] = [
        [401, 'aiProviderAuth', 502],
        [429, 'aiProviderRateLimited', 429],
        [404, 'aiModelListFailed', 502],
        [500, 'aiModelListFailed', 502],
      ]
      for (const [status, key, statusCode] of failures) {
        answer(status, JSON.stringify({ error: UPSTREAM_SECRET }))
        const error: any = await expectSystemErrorKey(deps.listModels(cfg()), key)
        expect(error.statusCode).toBe(statusCode)
        expect(error.params ?? {}).toEqual({})
        expect(JSON.stringify([error.message, error.params])).not.toContain('db.corp.local')
      }
    })

    test('an answer that is not JSON, a connection failure and a redirect are "model list failed"', async () => {
      answer(200, `not json ${UPSTREAM_SECRET}`)
      const notJson: any = await expectSystemErrorKey(deps.listModels(cfg()), 'aiModelListFailed')
      handler = (_request, response) => {
        response.writeHead(307, { location: 'http://169.254.169.254/' })
        response.end()
      }
      const redirected: any = await expectSystemErrorKey(deps.listModels(cfg()), 'aiModelListFailed')
      const refused: any = await expectSystemErrorKey(
        deps.listModels({ ...cfg(), baseUrl: `http://127.0.0.1:${closedPort}/v1` }),
        'aiModelListFailed'
      )
      for (const error of [notJson, redirected, refused]) {
        expect(error.params ?? {}).toEqual({})
        expect(JSON.stringify([error.message, error.params])).not.toContain('db.corp.local')
      }
    })

    test('discovery of a user endpoint never uses the global fetch', async () => {
      const originalFetch = globalThis.fetch
      globalThis.fetch = (() => {
        throw new Error('the global fetch must not be used')
      }) as any
      try {
        answer(200, JSON.stringify({ data: [{ id: 'm1' }] }))
        expect(await ModelDiscovery.listForProvider(cfg(), { allowlist: [`http://127.0.0.1:${port}`] })).toEqual([
          { id: 'm1' },
        ])
      } finally {
        globalThis.fetch = originalFetch
      }
    })
  })
})
