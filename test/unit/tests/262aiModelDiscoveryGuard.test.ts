import * as AiProviderService from '@server/modules/ai/service/aiProviderService'
import * as ModelDiscovery from '@server/modules/ai/service/modelDiscovery'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

/**
 * Builds a DNS lookup that resolves every name to the addresses.
 * @param {...string} addresses - Addresses to answer.
 * @returns {Function} The lookup.
 */
const lookupTo =
  (...addresses: string[]) =>
  async () =>
    addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }))

/**
 * A DNS lookup that fails the test when called.
 * @returns {Promise<never>} Always rejects.
 */
const neverCalledLookup = async () => {
  throw new Error('lookup must not be called')
}

describe('model discovery SSRF guard (262)', () => {
  let fetchCalls: { url: string; init: any }[] = []
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    fetchCalls = []
    /**
     * Records the call and answers a model list.
     * @param {any} input - Request URL.
     * @param {any} init - Request init.
     * @returns {Promise<Response>} The response.
     */
    globalThis.fetch = (async (input: any, init: any) => {
      fetchCalls.push({ url: String(input), init })
      return new Response(JSON.stringify({ data: [{ id: 'm1' }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as any
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test('a host name that resolves to a private address is refused before any request', async () => {
    await expectSystemErrorKey(
      ModelDiscovery.listForProvider(
        { provider: 'openai-compatible', baseUrl: 'http://llm.attacker.example/v1', apiKey: 'k' },
        { allowlist: [], lookup: lookupTo('10.0.0.5') }
      ),
      'aiBaseUrlNotAllowed'
    )
    expect(fetchCalls).toEqual([])
  })

  test('an allowlisted organisation server is listed, and redirects are refused', async () => {
    const models = await ModelDiscovery.listForProvider(
      { provider: 'openai-compatible', baseUrl: 'http://10.0.0.5:8000/v1/', apiKey: 'k' },
      { allowlist: ['http://10.0.0.5:8000/v1'], lookup: neverCalledLookup }
    )
    expect(models).toEqual([{ id: 'm1' }])
    expect(fetchCalls.map((call) => [call.url, call.init.redirect])).toEqual([
      ['http://10.0.0.5:8000/v1/models', 'error'],
    ])
  })

  test('the provider service lists drafts and saved providers through the guard', async () => {
    const deps = {
      ...AiProviderService.createDefaultAiProviderServiceDeps(),
      /**
       * Fails the test when prefs are written.
       * @returns {Promise<never>} Never resolves.
       */
      savePrefs: async () => {
        throw new Error('listing models never writes')
      },
    }
    await expectSystemErrorKey(
      AiProviderService.listProviderModels({
        user: { uuid: 'u1', prefs: {} } as any,
        input: { type: 'openai-compatible', baseUrl: 'http://127.0.0.1:1234/v1' },
        deps,
      }),
      'aiBaseUrlNotAllowed'
    )
    const user: any = {
      uuid: 'u1',
      prefs: {
        ai: {
          providers: [
            { id: 'acct:x', type: 'openai-compatible', name: 'X', model: 'm', baseUrl: 'http://169.254.169.254/v1' },
          ],
        },
      },
    }
    await expectSystemErrorKey(
      AiProviderService.listProviderModels({ user, input: { id: 'acct:x' }, deps }),
      'aiBaseUrlNotAllowed'
    )
    expect(fetchCalls).toEqual([])
  })
})
