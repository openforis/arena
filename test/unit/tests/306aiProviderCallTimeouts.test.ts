import { ENV } from '@core/processUtils'
import * as AiProviderService from '@server/modules/ai/service/aiProviderService'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { createTestHttpServer } from '@test/unit/utils/testHttpServer'

const TIMEOUT_MS = 150
// the time the test allows for a call that the timeout must have stopped
const PROMPT_MS = 3000

describe('calls that never finish are stopped by the timeout (306)', () => {
  const server = createTestHttpServer()
  const originalAllowlist = ENV.aiOrgHostedBaseUrls
  const originalTimeout = ENV.aiRequestTimeoutMs
  const deps = AiProviderService.createDefaultAiProviderServiceDeps()
  const cfg = () => ({
    provider: 'openai-compatible',
    model: 'm',
    baseUrl: `http://127.0.0.1:${server.port}/v1`,
    apiKey: 'k',
  })

  beforeAll(async () => {
    await server.start()
    ENV.aiOrgHostedBaseUrls = [`http://127.0.0.1:${server.port}`]
    ENV.aiRequestTimeoutMs = TIMEOUT_MS
  })

  afterAll(async () => {
    ENV.aiOrgHostedBaseUrls = originalAllowlist
    ENV.aiRequestTimeoutMs = originalTimeout
    await server.stop()
  })

  beforeEach(() => {
    server.closedRequests = 0
  })

  test('the connection test of an endpoint that never answers fails with "timeout" and closes the connection', async () => {
    server.handler = () => undefined
    const start = Date.now()
    const result = await deps.runTest({ user: { uuid: 'u1' } as any, cfg: cfg() })
    expect(result).toMatchObject({ ok: false, errorKey: 'aiRequestTimeout' })
    expect(Date.now() - start).toBeLessThan(PROMPT_MS)
    await server.untilClientClosed(PROMPT_MS)
  })

  test('the connection test of an endpoint that stops in the middle of its answer fails with "timeout"', async () => {
    server.handler = (_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.write('{"id":"x","choices":[')
    }
    const result = await deps.runTest({ user: { uuid: 'u1' } as any, cfg: cfg() })
    expect(result).toMatchObject({ ok: false, errorKey: 'aiRequestTimeout' })
    await server.untilClientClosed(PROMPT_MS)
  })

  test('the model list of an endpoint that never answers fails with "timeout" and closes the connection', async () => {
    server.handler = () => undefined
    const error: any = await expectSystemErrorKey(deps.listModels(cfg()), 'aiRequestTimeout')
    expect(error.statusCode).toBe(504)
    await server.untilClientClosed(PROMPT_MS)
  })

  test('the model list of an endpoint that stops in the middle of its answer fails with "timeout"', async () => {
    server.handler = (_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.write('{"data":[{"id":"m1"},')
    }
    await expectSystemErrorKey(deps.listModels(cfg()), 'aiRequestTimeout')
    await server.untilClientClosed(PROMPT_MS)
  })

  test('the timeout of a model list is the one of model calls when that is shorter than the usual 10 s', async () => {
    server.handler = () => undefined
    const start = Date.now()
    await expectSystemErrorKey(deps.listModels(cfg()), 'aiRequestTimeout')
    expect(Date.now() - start).toBeLessThan(TIMEOUT_MS + 1000)
  })
})
