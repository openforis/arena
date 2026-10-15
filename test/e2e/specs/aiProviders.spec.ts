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

/**
 * Checks that a response carries neither the key, nor a ciphertext, nor a stored provider.
 * @param {unknown} response - Parsed response body.
 * @param {string} secret - The plain key.
 * @returns {void}
 */
const expectNoKey = (response: unknown, secret: string): void => {
  const json = JSON.stringify(response)
  expect(json).not.toContain('apiKeyEncrypted')
  expect(json).not.toContain(secret)
  expect(json).not.toMatch(/"apiKey"\s*:/)
}

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
    for (const response of responses) expectNoKey(response, secret)
    expect((await api.getAiSettings()).providers[0]).toMatchObject({ id: provider.id, hasApiKey: true })
  })

  test('no user response carries prefs.ai: login, /auth/user, the survey users and the user itself', async ({
    api,
    request,
    testUser,
    survey,
  }) => {
    const secret = 'sk-e2e-user-secret'
    await api.addAiAccountProvider({ type: 'mock', model: 'mock', apiKey: secret })
    const userUuid = await api.getCurrentUserUuid()

    const login = await request.post('/auth/login', { data: { email: testUser.email, password: testUser.password } })
    const loginWithSurvey = await request.post('/auth/login?includeSurvey=true', {
      data: { email: testUser.email, password: testUser.password },
    })
    const responses = [
      (await login.json()).user,
      (await loginWithSurvey.json()).user,
      (await api.requestRaw('get', '/auth/user')).body.user,
      (await api.requestRaw('get', `/api/survey/${survey.id}/users`)).body,
      (await api.requestRaw('get', `/api/survey/${survey.id}/user/${userUuid}`)).body,
      (await api.requestRaw('get', `/api/survey/${survey.id}/current-user-group`)).body,
    ]
    for (const response of responses) {
      expectNoKey(response, secret)
      expect(JSON.stringify(response)).not.toMatch(/"ai(Usage)?"\s*:/)
    }
    // the users are real users, not empty answers
    expect(responses[0]).toMatchObject({ uuid: userUuid })
    expect(responses[3].list.map((listed: any) => listed.uuid)).toContain(userUuid)
    expect(responses[5]).toMatchObject({ user: { uuid: userUuid } })
  })

  test('prefs.ai and prefs.aiUsage cannot be written through POST /api/user/:uuid/prefs', async ({ api }) => {
    const { provider } = await api.addAiAccountProvider({ type: 'mock', model: 'mock', apiKey: 'sk-e2e-kept' })
    const { user } = (await api.requestRaw('get', '/auth/user')).body
    const forgedProvider = { id: 'acct:forged', type: 'mock', name: 'Forged', model: 'mock', apiKeyEncrypted: 'v2:x' }
    // the profile page posts the whole user: here with an AI section the browser never had
    const forged = { ...user, prefs: { ...user.prefs, ai: { providers: [forgedProvider] }, aiUsage: { calls: 0 } } }
    const response = await api.requestRaw('post', `/api/user/${user.uuid}/prefs`, forged)
    expect(response.status).toBe(200)

    const settings = await api.getAiSettings()
    expect(settings.providers.map((listed: any) => listed.id)).toEqual([provider.id])
    expect(settings.providers[0]).toMatchObject({ hasApiKey: true, apiKeyReadable: true })
    // the key still works: a test with the saved key succeeds
    const probe = await api.requestRaw('post', '/api/ai/providers/test', { id: provider.id })
    expect(probe).toMatchObject({ status: 200, body: { ok: true } })
  })
})
