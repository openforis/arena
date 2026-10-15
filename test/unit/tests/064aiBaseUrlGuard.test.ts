import http from 'node:http'
import type { AddressInfo } from 'node:net'

import * as AiProviderService from '@server/modules/ai/service/aiProviderService'
import * as ModelDiscovery from '@server/modules/ai/service/modelDiscovery'
import { buildModel, buildUserModel } from '@server/modules/ai/service/providerRegistry'
import { assertBaseUrlAllowed, isAllowlisted, isBlockedAddress } from '@server/modules/ai/service/baseUrlGuard'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const lookupTo =
  (...addresses: string[]) =>
  async () =>
    addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }))

const failingLookup = async () => {
  throw Object.assign(new Error('getaddrinfo ENOTFOUND llm.example'), { code: 'ENOTFOUND' })
}

const neverCalledLookup = async () => {
  throw new Error('lookup must not be called')
}

describe('isBlockedAddress', () => {
  test.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.10',
    '169.254.169.254',
    '0.0.0.0',
    '100.64.0.1',
    '255.255.255.255',
    '::1',
    '::',
    'fd00::1',
    'fe80::1',
    'fec0::1', // deprecated site-local
    'feff::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:a9fe:a9fe',
    '2002:7f00:1::1', // 6to4
    '2001:0:7f00:1::1', // Teredo
    '64:ff9b:1::7f00:1', // local-use NAT64
    '::ffff:0:7f00:1', // IPv4-translated
    'not-an-ip',
  ])('blocks %s', (address) => {
    expect(isBlockedAddress(address)).toBe(true)
  })

  test.each(['8.8.8.8', '172.32.0.1', '2606:4700::1111', '::ffff:8.8.8.8'])('allows %s', (address) => {
    expect(isBlockedAddress(address)).toBe(false)
  })
})

describe('isAllowlisted', () => {
  const allowlist = ['http://10.0.0.5:8000/v1', 'https://llm.corp.example']

  test.each([
    ['http://10.0.0.5:8000/v1', true],
    ['http://10.0.0.5:8000/v1/', true],
    ['http://10.0.0.5:8000/v1/chat/completions', true],
    ['http://10.0.0.5:8000/v10', false],
    ['http://10.0.0.5:8001/v1', false],
    ['https://10.0.0.5:8000/v1', false],
    ['https://llm.corp.example/anything', true],
  ])('%s → %s', (url, expected) => {
    expect(isAllowlisted(new URL(url), allowlist)).toBe(expected)
  })

  test('ignores invalid allowlist entries', () => {
    expect(isAllowlisted(new URL('http://10.0.0.5/'), ['not a url', ''])).toBe(false)
  })
})

describe('assertBaseUrlAllowed', () => {
  test.each([
    'http://127.0.0.1:1234/v1',
    'http://2130706433/v1', // decimal 127.0.0.1
    'http://0x7f.0.0.1/v1', // hex 127.0.0.1
    'http://[::1]:11434/v1',
    'http://[::ffff:127.0.0.1]/v1',
    'http://169.254.169.254/latest/meta-data',
  ])('refuses the literal internal address %s without a DNS lookup', async (baseUrl) => {
    await expectSystemErrorKey(
      assertBaseUrlAllowed(baseUrl, { allowlist: [], lookup: neverCalledLookup }),
      'aiBaseUrlNotAllowed'
    )
  })

  test('refuses a name resolving to a private address', async () => {
    const error = await expectSystemErrorKey(
      assertBaseUrlAllowed('http://llm.internal.example/v1', { allowlist: [], lookup: lookupTo('10.0.0.5') }),
      'aiBaseUrlNotAllowed'
    )
    expect(error.statusCode).toBe(400)
  })

  test('refuses a name when any of its addresses is private', async () => {
    await expectSystemErrorKey(
      assertBaseUrlAllowed('https://api.example.com/v1', { allowlist: [], lookup: lookupTo('93.184.216.34', '::1') }),
      'aiBaseUrlNotAllowed'
    )
  })

  test('refuses localhost and non-http schemes and invalid URLs', async () => {
    const options = { allowlist: [], lookup: lookupTo('127.0.0.1') }
    await expectSystemErrorKey(assertBaseUrlAllowed('http://localhost:1234/v1', options), 'aiBaseUrlNotAllowed')
    await expectSystemErrorKey(assertBaseUrlAllowed('ftp://example.com/', options), 'aiBaseUrlNotAllowed')
    await expectSystemErrorKey(assertBaseUrlAllowed('not a url', options), 'aiBaseUrlNotAllowed')
  })

  test('accepts a public name', async () => {
    await expect(
      assertBaseUrlAllowed('https://api.example.com/v1', { allowlist: [], lookup: lookupTo('93.184.216.34') })
    ).resolves.toBeUndefined()
  })

  test('accepts an allowlisted internal URL without a DNS lookup', async () => {
    await expect(
      assertBaseUrlAllowed('http://10.0.0.5:8000/v1', {
        allowlist: ['http://10.0.0.5:8000/v1'],
        lookup: neverCalledLookup,
      })
    ).resolves.toBeUndefined()
  })

  test('reports a DNS failure as aiProviderUnavailable', async () => {
    const error = await expectSystemErrorKey(
      assertBaseUrlAllowed('https://llm.example/v1', { allowlist: [], lookup: failingLookup }),
      'aiProviderUnavailable'
    )
    expect(error.statusCode).toBe(502)
  })
})

describe('buildUserModel redirects', () => {
  test('openai-compatible model calls refuse redirects', async () => {
    const reached: string[] = []
    // the second server is allowlisted too: it is only not reached because the redirect is not followed
    const target = http.createServer((request, response) => {
      reached.push(`target ${request.url}`)
      response.end('{}')
    })
    const redirector = http.createServer((request, response) => {
      reached.push(`redirector ${request.url}`)
      response.writeHead(307, {
        location: `http://127.0.0.1:${(target.address() as AddressInfo).port}/v1/chat/completions`,
      })
      response.end()
    })
    for (const server of [target, redirector])
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const origins = [target, redirector].map((server) => `http://127.0.0.1:${(server.address() as AddressInfo).port}`)
    try {
      const model: any = await buildUserModel(
        { provider: 'openai-compatible', model: 'm', baseUrl: `${origins[1]}/v1` },
        { allowlist: origins, lookup: neverCalledLookup }
      )
      await expect(
        model.doGenerate({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }], maxRetries: 0 })
      ).rejects.toBeDefined()
    } finally {
      for (const server of [target, redirector]) {
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
      }
    }
    expect(reached).toEqual(['redirector /v1/chat/completions'])
  })
})

describe('buildUserModel guards the address when the call connects', () => {
  const prompt = [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }]

  /**
   * Builds a DNS lookup that answers a public address for the pre-check and a loopback one afterwards (rebinding).
   * @returns {Function} The lookup, with the number of calls on `calls`.
   */
  const rebindingLookup = () => {
    const lookup: any = async () => {
      lookup.calls += 1
      return [{ address: lookup.calls === 1 ? '93.184.216.34' : '127.0.0.1', family: 4 }]
    }
    lookup.calls = 0
    return lookup as ((...args: unknown[]) => Promise<{ address: string; family: number }[]>) & { calls: number }
  }

  test.each(['openai-compatible', 'vercel-ai-sdk'])(
    'a %s model call to a name that resolves to loopback after the pre-check is refused',
    async (provider) => {
      const lookup = rebindingLookup()
      // the connect-time check is the only thing between the model call and 127.0.0.1: a plain fetch fails the test
      const model: any = await buildUserModel(
        { provider, model: 'm', baseUrl: 'http://rebind.attacker.example:9/v1', apiKey: 'k' },
        { allowlist: [], lookup }
      )
      expect(lookup.calls).toBe(1)
      await expectSystemErrorKey(model.doGenerate({ prompt, maxRetries: 0 }), 'aiBaseUrlNotAllowed')
      expect(lookup.calls).toBe(2)
    }
  )

  test('buildModel takes the fetch of the calls, and uses it for both kinds of user endpoint', async () => {
    const urls: string[] = []
    const fetchImpl = async (input: any) => {
      urls.push(String(input))
      throw new Error('stop')
    }
    for (const provider of ['openai-compatible', 'vercel-ai-sdk']) {
      const model: any = buildModel(
        { provider, model: 'm', baseUrl: 'https://llm.example.org/v1', apiKey: 'k' },
        { fetchImpl }
      )
      await model.doGenerate({ prompt, maxRetries: 0 }).catch(() => undefined)
    }
    expect(urls).toHaveLength(2)
  })
})

describe('guard wiring', () => {
  const internalUrl = 'http://127.0.0.1:1234/v1'

  test('buildUserModel refuses an internal base URL', async () => {
    await expectSystemErrorKey(
      buildUserModel({ provider: 'openai-compatible', model: 'm', baseUrl: internalUrl }, { allowlist: [] }),
      'aiBaseUrlNotAllowed'
    )
  })

  test('testProvider reports aiBaseUrlNotAllowed for an internal base URL', async () => {
    const result: any = await AiProviderService.testProvider({
      user: { uuid: 'u1' } as any,
      input: { type: 'openai-compatible', model: 'm', baseUrl: internalUrl, apiKey: 'k' },
    })
    expect(result.ok).toBe(false)
    expect(result.errorKey).toBe('aiBaseUrlNotAllowed')
  })

  test('listForProvider (openai-compatible) refuses an internal base URL', async () => {
    await expectSystemErrorKey(
      ModelDiscovery.listForProvider({ provider: 'openai-compatible', baseUrl: internalUrl, apiKey: 'k' }),
      'aiBaseUrlNotAllowed'
    )
  })
})
