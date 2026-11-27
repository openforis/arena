import express from 'express'
import type { AddressInfo } from 'node:net'

import * as ProcessUtils from '@core/processUtils'
import { createGuestRateLimit } from '@server/utils/guestRateLimit'

const env = ProcessUtils.ENV
const envPrev = {
  guestRateLimitEnabled: env.guestRateLimitEnabled,
  guestRateLimitRequestsPerWindow: env.guestRateLimitRequestsPerWindow,
}

// server with two endpoints limited each by its own guest rate limit
const startServer = async () => {
  const app = express()
  app.get('/a', createGuestRateLimit(), (_req, res) => res.json({ ok: true }))
  app.get('/b', createGuestRateLimit(), (_req, res) => res.json({ ok: true }))
  const server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address() as AddressInfo
  const get = async (path: string) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`)
    return { status: response.status, body: await response.json() }
  }
  return { get, close: () => new Promise((resolve) => server.close(resolve)) }
}

describe('guest rate limit', () => {
  afterEach(() => {
    Object.assign(env, envPrev)
  })

  test('answers 429 with an error key over the limit', async () => {
    Object.assign(env, { guestRateLimitEnabled: true, guestRateLimitRequestsPerWindow: 2 })
    const { get, close } = await startServer()
    try {
      expect((await get('/a')).status).toBe(200)
      expect((await get('/a')).status).toBe(200)
      const { status, body } = await get('/a')
      expect(status).toBe(429)
      expect(body.key).toBe('appErrors:tooManyRequests')
      // each limit counts on its own
      expect((await get('/b')).status).toBe(200)
    } finally {
      await close()
    }
  })

  test('does not limit when disabled', async () => {
    Object.assign(env, { guestRateLimitEnabled: false, guestRateLimitRequestsPerWindow: 1 })
    const { get, close } = await startServer()
    try {
      for (let i = 0; i < 3; i++) {
        expect((await get('/a')).status).toBe(200)
      }
    } finally {
      await close()
    }
  })
})
