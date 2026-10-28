import http from 'node:http'
import type { AddressInfo } from 'node:net'

import { ENV } from '@core/processUtils'
import * as AiProviderService from '@server/modules/ai/service/aiProviderService'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const TIMEOUT_MS = 150
// the time the test allows for a call that the timeout must have stopped
const PROMPT_MS = 3000

describe('calls that never finish are stopped by the timeout (306)', () => {
  let server: http.Server
  let port: number
  let handler: (request: http.IncomingMessage, response: http.ServerResponse) => void
  // sockets of the server that were closed by the client
  let closedRequests = 0
  const originalAllowlist = ENV.aiOrgHostedBaseUrls
  const originalTimeout = ENV.aiRequestTimeoutMs
  const deps = AiProviderService.createDefaultAiProviderServiceDeps()
  const cfg = () => ({
    provider: 'openai-compatible',
    model: 'm',
    baseUrl: `http://127.0.0.1:${port}/v1`,
    apiKey: 'k',
  })

  /**
   * Waits until the client has closed the connection of a request, or fails.
   * @returns {Promise<void>} Resolves when a request was closed.
   */
  const untilClientClosed = async () => {
    const start = Date.now()
    while (closedRequests === 0 && Date.now() - start < PROMPT_MS) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    expect(closedRequests).toBeGreaterThan(0)
  }

  beforeAll(async () => {
    server = http.createServer((request, response) => {
      response.on('close', () => {
        closedRequests += 1
      })
      handler(request, response)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    port = (server.address() as AddressInfo).port
    ENV.aiOrgHostedBaseUrls = [`http://127.0.0.1:${port}`]
    ENV.aiRequestTimeoutMs = TIMEOUT_MS
  })

  afterAll(async () => {
    ENV.aiOrgHostedBaseUrls = originalAllowlist
    ENV.aiRequestTimeoutMs = originalTimeout
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })

  beforeEach(() => {
    closedRequests = 0
  })

  test('the connection test of an endpoint that never answers fails with "timeout" and closes the connection', async () => {
    handler = () => undefined
    const start = Date.now()
    const result = await deps.runTest({ user: { uuid: 'u1' } as any, cfg: cfg() })
    expect(result).toMatchObject({ ok: false, errorKey: 'aiRequestTimeout' })
    expect(Date.now() - start).toBeLessThan(PROMPT_MS)
    await untilClientClosed()
  })

  test('the connection test of an endpoint that stops in the middle of its answer fails with "timeout"', async () => {
    handler = (_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.write('{"id":"x","choices":[')
    }
    const result = await deps.runTest({ user: { uuid: 'u1' } as any, cfg: cfg() })
    expect(result).toMatchObject({ ok: false, errorKey: 'aiRequestTimeout' })
    await untilClientClosed()
  })

  test('the model list of an endpoint that never answers fails with "timeout" and closes the connection', async () => {
    handler = () => undefined
    const error: any = await expectSystemErrorKey(deps.listModels(cfg()), 'aiRequestTimeout')
    expect(error.statusCode).toBe(504)
    await untilClientClosed()
  })

  test('the model list of an endpoint that stops in the middle of its answer fails with "timeout"', async () => {
    handler = (_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.write('{"data":[{"id":"m1"},')
    }
    await expectSystemErrorKey(deps.listModels(cfg()), 'aiRequestTimeout')
    await untilClientClosed()
  })

  test('the timeout of a model list is the one of model calls when that is shorter than the usual 10 s', async () => {
    handler = () => undefined
    const start = Date.now()
    await expectSystemErrorKey(deps.listModels(cfg()), 'aiRequestTimeout')
    expect(Date.now() - start).toBeLessThan(TIMEOUT_MS + 1000)
  })
})
