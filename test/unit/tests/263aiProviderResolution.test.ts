import { MockLanguageModelV4 } from 'ai/test'

import { parseGatewayRequest } from '@server/modules/ai/service/gateway/callValidation'
import { handleModelRequest } from '@server/modules/ai/service/gateway/modelGateway'
import { createRateLimiter } from '@server/modules/ai/service/gateway/rateLimiter'
import * as ProviderResolver from '@server/modules/ai/service/providerResolver'
import * as SecretBox from '@server/utils/crypto/secretBox'
import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { createFakeRequest, createFakeResponse } from '@test/unit/utils/fakeExpress'

const SECRET = 'c'.repeat(64)
const adminConfig = {
  provider: 'openai-compatible',
  model: 'admin-model',
  baseUrl: 'http://admin.example.org/v1',
  apiKey: 'sk-admin',
}
const prompt = [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }]
/**
 * Builds a chatbot gateway body.
 * @param {Record<string, unknown>} override - Fields to override.
 * @returns {object} The body.
 */
const chatBody = (override: Record<string, unknown> = {}) => ({
  feature: 'chatbot',
  dataClass: 'schema',
  stream: false,
  call: { prompt },
  ...override,
})

/**
 * Builds a user with the given AI prefs on top of an enabled chat setup.
 * @param {Record<string, unknown>} ai - AI prefs to add.
 * @returns {any} The user.
 */
const userWith = (ai: Record<string, unknown>): any => ({
  uuid: 'u1',
  prefs: { ai: { accessLevel: 1, featuresEnabled: true, featureToggles: { chat: true }, ...ai } },
})

describe('provider resolution by id (263)', () => {
  let originalSecret: string | undefined
  let ownProvider: Record<string, unknown>

  beforeAll(() => {
    originalSecret = process.env.AI_USER_KEY_ENCRYPTION_SECRET
    process.env.AI_USER_KEY_ENCRYPTION_SECRET = SECRET
    ownProvider = {
      id: 'acct:own',
      type: 'openai',
      name: 'Work',
      model: 'gpt-x',
      baseUrl: null,
      apiKeyEncrypted: SecretBox.encrypt('sk-own'),
    }
  })

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.AI_USER_KEY_ENCRYPTION_SECRET
    else process.env.AI_USER_KEY_ENCRYPTION_SECRET = originalSecret
  })

  test('an own account provider resolves with its decrypted key', () => {
    const user = userWith({ defaultProviderId: 'arena-default', providers: [ownProvider] })
    expect(ProviderResolver.resolveProviderConfig({ user, providerId: 'acct:own', adminConfig })).toEqual({
      cfg: { provider: 'openai', model: 'gpt-x', baseUrl: null, apiKey: 'sk-own' },
      source: 'user',
      providerId: 'acct:own',
    })
  })

  test('arena-default is the admin default; without one it is aiNotConfigured', async () => {
    const user = userWith({ defaultProviderId: 'acct:own', providers: [ownProvider] })
    expect(ProviderResolver.resolveProviderConfig({ user, providerId: 'arena-default', adminConfig })).toEqual({
      cfg: adminConfig,
      source: 'admin-default',
      providerId: 'arena-default',
    })
    const error: any = await expectSystemErrorKey(
      () => ProviderResolver.resolveProviderConfig({ user, providerId: 'arena-default', adminConfig: null }),
      'aiNotConfigured'
    )
    expect(error.statusCode).toBe(503)
  })

  test('a foreign or unknown account id is 404, a local id is 400', async () => {
    const user = userWith({ providers: [ownProvider] })
    const foreign: any = await expectSystemErrorKey(
      () => ProviderResolver.resolveProviderConfig({ user, providerId: 'acct:not-mine', adminConfig }),
      'aiProviderNotFound'
    )
    expect(foreign.statusCode).toBe(404)
    const local: any = await expectSystemErrorKey(
      () => ProviderResolver.resolveProviderConfig({ user, providerId: 'local:legacy', adminConfig }),
      'aiProviderNotGateway'
    )
    expect(local.statusCode).toBe(400)
  })

  test('a saved key of the old single-provider slot is the account provider acct:legacy', () => {
    const oldSlot = userWith({
      provider: 'openai',
      model: 'gpt-x',
      enabled: true,
      apiKeyEncrypted: ownProvider.apiKeyEncrypted,
    })
    expect(
      ProviderResolver.resolveProviderConfig({ user: oldSlot, providerId: 'acct:legacy', adminConfig })
    ).toMatchObject({
      providerId: 'acct:legacy',
      cfg: { apiKey: 'sk-own' },
    })
  })

  test('an unreadable key fails instead of switching to the admin default', async () => {
    const user = userWith({
      defaultProviderId: 'acct:own',
      providers: [{ ...ownProvider, apiKeyEncrypted: 'v1:AAAA' }],
    })
    const error: any = await expectSystemErrorKey(
      () => ProviderResolver.resolveProviderConfig({ user, providerId: 'acct:own', adminConfig }),
      'aiApiKeyUnreadable'
    )
    expect(error.statusCode).toBe(409)
    // the description (settings panel) still names the provider the calls use
    expect(ProviderResolver.describeProvider({ user, providerId: 'acct:own' })).toMatchObject({
      source: 'user',
      provider: 'openai',
    })
  })

  test('the gateway request keeps a valid providerId and refuses a malformed one', async () => {
    expect(parseGatewayRequest(chatBody({ providerId: 'acct:own' })).providerId).toBe('acct:own')
    expect(parseGatewayRequest(chatBody())).not.toHaveProperty('providerId')
    expect(parseGatewayRequest(chatBody({ providerId: null }))).not.toHaveProperty('providerId')
    const error: any = await expectSystemErrorKey(
      () => parseGatewayRequest(chatBody({ providerId: 'acct:../../x' })),
      'aiCallInvalid'
    )
    expect([error.statusCode, error.params]).toEqual([400, { reason: 'providerId' }])
  })

  /**
   * Runs the gateway handler with a resolver and returns the response and the policy checks.
   * @param {unknown} body - Request body.
   * @param {any} user - Caller.
   * @param {any} resolveModel - Model resolver dependency.
   * @returns {Promise<{res: any, checks: any[]}>} The response and the checks.
   */
  const runGateway = async (body: unknown, user: any, resolveModel: any) => {
    const checks: any[] = []
    const deps: any = {
      resolveModel,
      assertPolicyAllows: async (check: any) => {
        checks.push(check)
      },
      rateLimiter: createRateLimiter({ limitPerMinute: 0 }),
      recordTelemetry: () => {},
      logError: () => {},
      limits: { maxPromptChars: 1000, maxOutputTokens: 100, timeoutMs: 5000 },
      gateEnv: { aiFeaturesEnabled: true, aiFeatureFlags: null },
    }
    const res = createFakeResponse()
    await handleModelRequest({ req: createFakeRequest(body), res, user, deps })
    return { res, checks }
  }

  test('the gateway passes the providerId to the resolver and checks the policy with its hosting class', async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () =>
        ({
          content: [{ type: 'text', text: 'ok' }],
          finishReason: { unified: 'stop', raw: 'stop' },
          usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } },
          warnings: [],
        }) as any,
    })
    const asked: unknown[] = []
    const { res, checks } = await runGateway(chatBody({ providerId: 'acct:own' }), userWith({}), async (args: any) => {
      asked.push(args.providerId)
      return { model, meta: { source: 'user', provider: 'openai-compatible', model: 'm', hostingClass: 'orgHosted' } }
    })
    expect(res.statusCode).toBe(200)
    expect(asked).toEqual(['acct:own'])
    expect(checks).toEqual([{ surveyId: null, dataClass: 'schema', hostingClass: 'orgHosted' }])
  })

  test("the gateway answers 404 for a provider that is not the user's and 400 for a local one", async () => {
    const user = userWith({ providers: [ownProvider] })
    const resolve = ({ user: caller, providerId }: any) =>
      ProviderResolver.resolveModelForUser({ user: caller, providerId })
    const foreign = await runGateway(chatBody({ providerId: 'acct:not-mine' }), user, resolve)
    expect([foreign.res.statusCode, foreign.res.body.key]).toEqual([404, 'aiProviderNotFound'])
    expect(foreign.checks).toEqual([])
    const local = await runGateway(chatBody({ providerId: 'local:legacy' }), user, resolve)
    expect([local.res.statusCode, local.res.body.key]).toEqual([400, 'aiProviderNotGateway'])
  })
})
