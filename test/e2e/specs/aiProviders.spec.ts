import { expect, test } from '../fixtures'

// the server must run with the mock provider (see test/e2e/README.md)
const aiMock = process.env.E2E_AI_MOCK === 'true'

/**
 * Builds the body of a non-streaming chatbot call to the gateway.
 * @param {string} [providerId] - Provider id to call (omitted: the user's default).
 * @returns {object} The request body.
 */
const chatCall = (providerId?: string) => ({
  feature: 'chatbot',
  dataClass: 'schema',
  stream: false,
  call: { prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hello' }] }] },
  ...(providerId ? { providerId } : {}),
})

test.describe('AI account providers API (mock provider)', () => {
  test.skip(!aiMock, 'needs a server started with AI_MOCK_PROVIDER_ENABLED=true and AI_DEFAULT_PROVIDER=mock')

  test.beforeEach(async ({ api }) => {
    await api.enableAiFeatures()
  })

  // the user is shared by the worker: leave it with no providers and AI off for the other specs
  test.afterEach(async ({ api }) => {
    const settings = await api.getAiSettings()
    for (const provider of settings.providers ?? []) await api.removeAiAccountProvider(provider.id)
    await api.disableAiFeatures()
  })

  test('add, make default, call through the gateway, remove', async ({ api }) => {
    const { provider } = await api.addAiAccountProvider({ type: 'mock', name: 'Mock account', model: 'mock' })
    expect(provider).toMatchObject({ type: 'mock', name: 'Mock account', hostingClass: 'cloud', lastTestOk: true })
    expect(provider.id).toMatch(/^acct:/)
    // the e2e server has an admin default, so the new provider does not become the default by itself
    expect((await api.getAiSettings()).defaultProviderId).toBe('arena-default')

    await api.setAiDefaultProvider(provider.id)
    expect(await api.getAiSettings()).toMatchObject({ defaultProviderId: provider.id, defaultProviderOrigin: 'user' })

    for (const providerId of [provider.id, 'arena-default', undefined]) {
      const { status } = await api.requestRaw('post', '/api/ai/model', chatCall(providerId))
      expect([providerId, status]).toEqual([providerId, 200])
    }

    await api.removeAiAccountProvider(provider.id)
    expect(await api.getAiSettings()).toMatchObject({ defaultProviderId: 'arena-default', providers: [] })
  })

  test("ids that are not the user's are refused", async ({ api }) => {
    const before = await api.getAiSettings()
    expect(await api.requestRaw('post', '/api/ai/model', chatCall('acct:not-mine'))).toMatchObject({
      status: 404,
      body: { key: 'aiProviderNotFound' },
    })
    expect(await api.requestRaw('post', '/api/ai/model', chatCall('local:legacy'))).toMatchObject({
      status: 400,
      body: { key: 'aiProviderNotGateway' },
    })
    expect((await api.requestRaw('put', '/api/ai/settings/default', { providerId: 'acct:not-mine' })).status).toBe(404)
    expect((await api.requestRaw('post', '/api/ai/providers/test', { id: 'acct:not-mine' })).status).toBe(404)
    expect((await api.requestRaw('put', '/api/ai/providers/acct%3Anot-mine', { name: 'x' })).status).toBe(404)
    expect((await api.requestRaw('delete', '/api/ai/providers/acct%3Anot-mine')).status).toBe(404)
    // the refused calls wrote nothing
    expect(await api.getAiSettings()).toEqual(before)
  })

  test('no response contains the API key', async ({ api }) => {
    const secret = 'sk-e2e-secret-key'
    const { provider, settings } = await api.addAiAccountProvider({ type: 'mock', model: 'mock', apiKey: secret })
    const edit = await api.requestRaw('put', `/api/ai/providers/${encodeURIComponent(provider.id)}`, {
      name: 'Renamed',
    })
    expect(edit.status).toBe(200)

    // the secret must not come back from test and model listing either, for a draft and for the saved id
    const draft = { type: 'mock', model: 'mock', apiKey: secret }
    const probes = [
      await api.requestRaw('post', '/api/ai/providers/test', draft),
      await api.requestRaw('post', '/api/ai/providers/test', { id: provider.id }),
      await api.requestRaw('post', '/api/ai/providers/models', draft),
      await api.requestRaw('post', '/api/ai/providers/models', { id: provider.id }),
    ]
    const responses = [provider, settings, edit.body, await api.getAiSettings(), ...probes.map((probe) => probe.body)]
    for (const response of responses) {
      const json = JSON.stringify(response)
      expect(json).not.toContain('apiKeyEncrypted')
      expect(json).not.toContain(secret)
      expect(json).not.toMatch(/"apiKey"\s*:/)
    }
    expect((await api.getAiSettings()).providers[0]).toMatchObject({ id: provider.id, hasApiKey: true })
  })

  test('the old settings body still saves and removes a personal provider', async ({ api }) => {
    await api.saveAiPersonalProvider({
      provider: 'openai-compatible',
      model: 'remote-model',
      baseUrl: 'https://models.example.org/v1',
    })
    expect(await api.getAiSettings()).toMatchObject({
      defaultProviderId: 'acct:legacy',
      enabled: true,
      provider: 'openai-compatible',
      providers: [expect.objectContaining({ id: 'acct:legacy', model: 'remote-model' })],
    })
    await api.removeAiPersonalProvider()
    expect(await api.getAiSettings()).toMatchObject({
      defaultProviderId: 'arena-default',
      enabled: false,
      provider: null,
      providers: [],
    })
  })
})
