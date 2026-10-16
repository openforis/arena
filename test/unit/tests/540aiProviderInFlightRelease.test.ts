import http from 'node:http'
import type { AddressInfo } from 'node:net'

import { ENV } from '@core/processUtils'
import * as SettingsApi from '@server/modules/ai/api/settingsApi'
import { createProviderRateLimit, limitProviderCalls } from '@server/modules/ai/api/providerRateLimit'
import { createRateLimiter } from '@server/modules/ai/service/gateway/rateLimiter'
import { createFakeResponse } from '@test/unit/utils/fakeExpress'
import { collectRoutes } from '@test/utils/routeUtils'

describe('The in-flight slot of a provider call lasts until its handler settles (540)', () => {
  let server: http.Server
  let port: number
  // the calls the endpoint of the provider holds: the test answers them when it decides
  let held: http.ServerResponse[]
  const originalAllowlist = ENV.aiOrgHostedBaseUrls

  const route = () => {
    const found = collectRoutes(SettingsApi.init).find((r) => r.method === 'post' && r.path === '/ai/providers/models')
    return { limit: found!.handlers.at(-2), handler: found!.handlers.at(-1) }
  }

  // answers the calls the endpoint holds, with an empty model list
  const answerHeldCalls = () => {
    for (const response of held) response.end('{"data":[]}')
    held = []
  }

  // a call of the user through the middleware, then the handler of the real route (a model list of a held endpoint)
  const startCall = (limit: any, handler: any) => {
    const res = createFakeResponse()
    const body = { type: 'openai-compatible', baseUrl: `http://127.0.0.1:${port}/v1`, apiKey: 'k', model: 'm' }
    const req = { user: { uuid: 'u1' }, body, params: {} }
    const next = jest.fn()
    limit(req, res, next)
    const accepted = next.mock.calls.length === 1
    const done = accepted ? handler(req, res, jest.fn()) : Promise.resolve()
    return { res, done, accepted }
  }

  const untilHeld = async (count: number) => {
    for (let waited = 0; held.length < count && waited < 3000; waited += 10) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    expect(held).toHaveLength(count)
  }

  beforeAll(async () => {
    server = http.createServer((request, response) => {
      request.resume()
      held.push(response)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    port = (server.address() as AddressInfo).port
    ENV.aiOrgHostedBaseUrls = [`http://127.0.0.1:${port}`]
  })

  afterAll(async () => {
    ENV.aiOrgHostedBaseUrls = originalAllowlist
    server.closeAllConnections()
    await new Promise((resolve) => server.close(resolve))
  })

  beforeEach(() => {
    held = []
  })

  test('a client that disconnects while the provider call runs keeps the slot until the handler settles', async () => {
    const { handler } = route()
    const limit = createProviderRateLimit({ limiter: createRateLimiter({ limitPerMinute: 0 }), maxInFlight: 1 })

    const first = startCall(limit, handler)
    expect(first.accepted).toBe(true)
    await untilHeld(1)
    first.res.disconnect()
    // the provider call is still running: no second one for this user
    const second = startCall(limit, handler)
    expect(second.accepted).toBe(false)
    expect(second.res.statusCode).toBe(429)

    answerHeldCalls()
    await first.done
    const third = startCall(limit, handler)
    expect(third.accepted).toBe(true)
    await untilHeld(1)
    answerHeldCalls()
    await third.done
  })

  test('the slot is freed when the handler fails, and only once', async () => {
    const { handler } = route()
    const limit = createProviderRateLimit({ limiter: createRateLimiter({ limitPerMinute: 0 }), maxInFlight: 1 })

    const first = startCall(limit, handler)
    await untilHeld(1)
    // the endpoint drops the connection: the handler ends with an error
    held[0].destroy()
    held = []
    await first.done
    const second = startCall(limit, handler)
    expect(second.accepted).toBe(true)
    await untilHeld(1)
    // the late 'close' of the first response must not free the slot of the second call
    first.res.emit('close')
    expect(startCall(limit, handler).accepted).toBe(false)
    answerHeldCalls()
    await second.done
  })

  test('the middleware of the route is the shared one', () => {
    expect(route().limit).toBe(limitProviderCalls)
  })
})
