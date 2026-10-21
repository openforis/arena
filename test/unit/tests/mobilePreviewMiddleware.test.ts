import type { NextFunction, Request, Response } from 'express'

import { mobilePreviewMiddleware } from '@server/system/mobilePreviewMiddleware'

const run = ({ path, query = {} }: { path: string; query?: Record<string, string> }) => {
  const headers: Record<string, string> = {}
  let status: number | null = null
  const res = {
    setHeader: (name: string, value: string) => {
      headers[name] = value
    },
    sendStatus: (code: number) => {
      status = code
    },
  } as unknown as Response
  const next = jest.fn() as NextFunction
  mobilePreviewMiddleware({ path, query } as unknown as Request, res, next)
  return { headers, status, nextCalled: (next as jest.Mock).mock.calls.length > 0 }
}

describe('mobilePreviewMiddleware', () => {
  test('allows embedding only by Arena pages', () => {
    const { headers } = run({ path: '/main.js' })
    expect(headers['Content-Security-Policy']).toBe("frame-ancestors 'self'")
  })

  test('serves the page in preview mode', () => {
    expect(run({ path: '/', query: { preview: '1', parentOrigin: 'https://arena.org' } }).nextCalled).toBe(true)
    expect(run({ path: '/index.html', query: { preview: '1' } }).nextCalled).toBe(true)
  })

  test('does not serve the page outside of preview mode', () => {
    for (const query of [{}, { preview: 'demo' }]) {
      for (const path of ['/', '/index.html']) {
        const { status, nextCalled } = run({ path, query })
        expect(status).toBe(404)
        expect(nextCalled).toBe(false)
      }
    }
  })

  test('serves the assets', () => {
    expect(run({ path: '/_expo/static/js/web/entry.js' }).nextCalled).toBe(true)
  })
})
