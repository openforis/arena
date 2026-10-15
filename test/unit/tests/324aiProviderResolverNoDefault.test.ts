import { MockLanguageModelV4 } from 'ai/test'

import { handleModelRequest } from '@server/modules/ai/service/gateway/modelGateway'
import { createRateLimiter } from '@server/modules/ai/service/gateway/rateLimiter'
import { createPingDeps } from '@server/modules/ai/api/internalApi'
import * as ProviderResolver from '@server/modules/ai/service/providerResolver'
import { formatErrorForLog } from '@server/modules/ai/service/gateway/errorMapping'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { createFakeRequest, createFakeResponse } from '@test/unit/utils/fakeExpress'

const adminConfig = { provider: 'openai-compatible', model: 'admin-model', baseUrl: 'http://admin.example.org/v1' }
const ownProvider = {
  id: 'acct:own',
  type: 'openai',
  name: 'Work',
  model: 'gpt-x',
  baseUrl: null,
  apiKeyEncrypted: null,
}

/**
 * Builds a user with the given default provider.
 * @param {string} defaultProviderId - Id of the default provider.
 * @returns {any} The user.
 */
const userWithDefault = (defaultProviderId: string): any => ({
  uuid: 'u1',
  prefs: {
    ai: {
      accessLevel: 1,
      featuresEnabled: true,
      featureToggles: { chat: true },
      defaultProviderId,
      providers: [ownProvider],
    },
  },
})

describe('the resolver never picks a provider by itself (324)', () => {
  test.each(['acct:own', 'arena-default', 'local:abc'])(
    'a call without a providerId is refused whatever the default of the user is (%s)',
    async (defaultProviderId) => {
      const error = await expectSystemErrorKey(
        () => ProviderResolver.resolveProviderConfig({ user: userWithDefault(defaultProviderId), adminConfig } as any),
        'aiCallInvalid'
      )
      expect([error.statusCode, error.params]).toEqual([400, { reason: 'providerId' }])
    }
  )

  test('so is resolving the model', async () => {
    await expectSystemErrorKey(
      () => ProviderResolver.resolveModelForUser({ user: userWithDefault('acct:own') } as any),
      'aiCallInvalid'
    )
  })

  test('there is no default-provider helper left to fall back on', () => {
    expect((ProviderResolver as any).getDefaultGatewayProviderId).toBeUndefined()
  })

  test('the gateway answers 400 to a request without a providerId, and calls no provider', async () => {
    const model = new MockLanguageModelV4()
    const res = createFakeResponse()
    const deps: any = {
      resolveModel: ProviderResolver.resolveModelForUser,
      assertPolicyAllows: async () => {},
      rateLimiter: createRateLimiter({ limitPerMinute: 0 }),
      recordTelemetry: () => {},
      logError: () => {},
      limits: { maxPromptChars: 1000, maxOutputTokens: 100, timeoutMs: 5000 },
      gateEnv: { aiFeaturesEnabled: true, aiFeatureFlags: null },
    }
    const body = {
      feature: 'chatbot',
      dataClass: 'schema',
      stream: false,
      call: { prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }] },
    }
    await handleModelRequest({ req: createFakeRequest(body), res, user: userWithDefault('acct:own'), deps })
    expect([res.statusCode, res.body.key]).toEqual([400, 'aiCallInvalid'])
    expect(model.doGenerateCalls).toHaveLength(0)
  })

  test('describing a provider names the one asked for, not a default', () => {
    const user = userWithDefault('arena-default')
    expect(ProviderResolver.describeProvider({ user, providerId: 'acct:own' })).toMatchObject({
      source: 'user',
      provider: 'openai',
    })
    expect(ProviderResolver.describeProvider({ user, providerId: 'arena-default', adminConfig })).toMatchObject({
      source: 'admin-default',
      provider: 'openai-compatible',
    })
  })

  test('describing a provider that cannot be resolved gives an empty description', () => {
    const empty = { source: null, provider: null, model: null, hostingClass: null }
    expect(
      ProviderResolver.describeProvider({ user: userWithDefault('arena-default'), providerId: 'acct:gone' })
    ).toEqual(empty)
    expect(
      ProviderResolver.describeProvider({
        user: userWithDefault('arena-default'),
        providerId: 'arena-default',
        adminConfig: null,
      })
    ).toEqual(empty)
  })
})

describe('the admin ping tests the instance default (324)', () => {
  test('it asks for Arena default, not for the default of the admin', async () => {
    // the test environment has no instance default: resolving the account provider instead would have worked
    await expectSystemErrorKey(
      () => createPingDeps().resolveModel({ user: userWithDefault('acct:own'), feature: 'internalPing' }),
      'aiNotConfigured'
    )
  })
})

describe('the logged body of a failed provider call is short (324)', () => {
  test('the response body is cut to 300 characters', () => {
    const error = Object.assign(new Error('Bad Request'), { responseBody: 'x'.repeat(5000), statusCode: 400 })
    const lines = formatErrorForLog('chatbot', error).split('\n')
    const bodyLine = lines.find((line) => line.startsWith('  responseBody: ')) as string
    expect(bodyLine.length).toBeLessThanOrEqual('  responseBody: '.length + 300 + 1)
    expect(bodyLine).toContain('x'.repeat(300))
    expect(bodyLine).not.toContain('x'.repeat(301))
  })

  test('the request headers are never logged', () => {
    const error = Object.assign(new Error('Unauthorized'), {
      statusCode: 401,
      url: 'https://api.example.com/v1/chat',
      requestBodyValues: { messages: ['secret prompt'] },
      responseHeaders: { 'set-cookie': 'session=abc' },
      requestHeaders: { authorization: 'Bearer sk-secret' },
      headers: { authorization: 'Bearer sk-secret' },
    })
    const text = formatErrorForLog('chatbot', error)
    expect(text).not.toContain('sk-secret')
    expect(text).not.toContain('secret prompt')
    expect(text).not.toContain('session=abc')
  })

  test('a short body is logged whole, and a missing one adds no line', () => {
    expect(formatErrorForLog('chatbot', Object.assign(new Error('x'), { responseBody: '{"error":"nope"}' }))).toContain(
      '  responseBody: {"error":"nope"}'
    )
    expect(formatErrorForLog('chatbot', new Error('x'))).not.toContain('responseBody')
  })
})
