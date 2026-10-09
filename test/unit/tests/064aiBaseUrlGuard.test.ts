import { buildUserModel } from '@server/modules/ai/service/providerRegistry'
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
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:a9fe:a9fe',
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
    const calls: any[] = []
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (_input: any, init: any) => {
      calls.push(init)
      throw new Error('stop')
    }) as any
    try {
      const model: any = await buildUserModel(
        { provider: 'openai-compatible', model: 'm', baseUrl: 'http://10.0.0.5:8000/v1' },
        { allowlist: ['http://10.0.0.5:8000/v1'], lookup: neverCalledLookup }
      )
      await model.doGenerate({ prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] }).catch(() => {})
    } finally {
      globalThis.fetch = originalFetch
    }
    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0].redirect).toBe('error')
  })
})
