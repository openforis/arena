import { MockLanguageModelV4 } from 'ai/test'

import { createPolicyEnforcer, getEffectivePolicyFor } from '@server/modules/ai/service/gateway/policy'
import { handleModelRequest } from '@server/modules/ai/service/gateway/modelGateway'
import { createRateLimiter } from '@server/modules/ai/service/gateway/rateLimiter'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'
import { createFakeRequest, createFakeResponse } from '@test/unit/utils/fakeExpress'

const cloudCeilings = { schema: 'cloud', data: 'cloud' } as const

const enforcerWith = ({ stored = null as unknown, ceilings = cloudCeilings as any } = {}) => {
  const fetched: number[] = []
  const enforce = createPolicyEnforcer({
    fetchRawPolicy: async (surveyId) => {
      fetched.push(surveyId)
      return stored
    },
    getCeilings: () => ceilings,
  })
  return { enforce, fetched }
}

describe('createPolicyEnforcer', () => {
  test('default survey policy: schema to the cloud is allowed', async () => {
    const { enforce, fetched } = enforcerWith()
    await expect(enforce({ surveyId: 7, dataClass: 'schema', hostingClass: 'cloud' })).resolves.toBeUndefined()
    expect(fetched).toEqual([7])
  })

  test('default survey policy: data to the cloud is refused with the params', async () => {
    const { enforce } = enforcerWith()
    const error: any = await expectSystemErrorKey(
      enforce({ surveyId: 7, dataClass: 'data', hostingClass: 'cloud' }),
      'aiPolicyRefused'
    )
    expect(error.statusCode).toBe(403)
    expect(error.params).toEqual({ dataClass: 'data', hostingClass: 'cloud', allowed: 'onDevice' })
  })

  test('the stored policy is applied', async () => {
    const { enforce } = enforcerWith({ stored: { schema: 'off', data: 'cloud' } })
    await expect(enforce({ surveyId: 7, dataClass: 'data', hostingClass: 'cloud' })).resolves.toBeUndefined()
    await expectSystemErrorKey(
      enforce({ surveyId: 7, dataClass: 'schema', hostingClass: 'orgHosted' }),
      'aiPolicyRefused'
    )
  })

  test('the ceiling wins over a more permissive survey policy', async () => {
    const { enforce } = enforcerWith({
      stored: { schema: 'cloud', data: 'cloud' },
      ceilings: { schema: 'orgHosted', data: 'cloud' },
    })
    await expectSystemErrorKey(enforce({ surveyId: 7, dataClass: 'schema', hostingClass: 'cloud' }), 'aiPolicyRefused')
    await expect(enforce({ surveyId: 7, dataClass: 'schema', hostingClass: 'orgHosted' })).resolves.toBeUndefined()
  })

  test('a corrupt stored class fails closed', async () => {
    const { enforce } = enforcerWith({ stored: { schema: 'everywhere' } })
    await expectSystemErrorKey(
      enforce({ surveyId: 7, dataClass: 'schema', hostingClass: 'onDevice' }),
      'aiPolicyRefused'
    )
  })

  test('a null hosting class is refused', async () => {
    const { enforce } = enforcerWith({ stored: { schema: 'cloud', data: 'cloud' } })
    const error: any = await expectSystemErrorKey(
      enforce({ surveyId: 7, dataClass: 'schema', hostingClass: null }),
      'aiPolicyRefused'
    )
    expect(error.params.hostingClass).toBe('unknown')
  })

  test('without a survey (Help chat) only the ceilings apply, and no policy is fetched', async () => {
    const { enforce, fetched } = enforcerWith({ ceilings: { schema: 'cloud', data: 'off' } })
    await expect(enforce({ surveyId: null, dataClass: 'schema', hostingClass: 'cloud' })).resolves.toBeUndefined()
    await expectSystemErrorKey(
      enforce({ surveyId: null, dataClass: 'data', hostingClass: 'onDevice' }),
      'aiPolicyRefused'
    )
    expect(fetched).toEqual([])
  })

  test('getEffectivePolicyFor returns the ceilings for no survey', async () => {
    const deps = {
      fetchRawPolicy: async () => ({ schema: 'off', data: 'off' }),
      getCeilings: () => ({ schema: 'orgHosted', data: 'cloud' }) as any,
    }
    expect(await getEffectivePolicyFor({ surveyId: null }, deps)).toEqual({ schema: 'orgHosted', data: 'cloud' })
    expect(await getEffectivePolicyFor({ surveyId: 3 }, deps)).toEqual({ schema: 'off', data: 'off' })
  })
})

describe('gateway with the real enforcer', () => {
  const generateModel = () =>
    new MockLanguageModelV4({
      doGenerate: async () =>
        ({
          content: [{ type: 'text', text: 'hello' }],
          finishReason: { unified: 'stop', raw: undefined },
          usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } },
          warnings: [],
        }) as any,
    })

  const run = async ({
    dataClass,
    feature,
    hostingClass,
  }: {
    dataClass: string
    feature: string
    hostingClass: string
  }) => {
    const model = generateModel()
    const { enforce } = enforcerWith()
    const deps = {
      resolveModel: async () => ({
        model,
        meta: { source: 'admin-default', provider: 'mock', model: 'mock', hostingClass },
      }),
      assertPolicyAllows: enforce,
      rateLimiter: createRateLimiter({ limitPerMinute: 0 }),
      recordTelemetry: () => {},
      logError: () => {},
      limits: { maxPromptChars: 1000, maxOutputTokens: 100, timeoutMs: 5000 },
      gateEnv: { aiFeaturesEnabled: true, aiFeatureFlags: null },
    }
    const req = createFakeRequest({
      surveyId: 1,
      feature,
      dataClass,
      stream: false,
      call: { prompt: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }] },
    })
    const user: any = {
      uuid: 'u1',
      prefs: { ai: { featuresEnabled: true, featureToggles: { userActivity: true, expressions: true } } },
    }
    const res = createFakeResponse()
    await handleModelRequest({ req, res, user, deps } as any)
    return { res, model }
  }

  test('refuses before the provider is called', async () => {
    const { res, model } = await run({ dataClass: 'data', feature: 'activityLogSummary', hostingClass: 'cloud' })
    expect(res.statusCode).toBe(403)
    expect(res.body.key).toBe('aiPolicyRefused')
    expect(res.body.params).toEqual({ dataClass: 'data', hostingClass: 'cloud', allowed: 'onDevice' })
    expect(model.doGenerateCalls).toHaveLength(0)
  })

  test('an allowed call reaches the provider', async () => {
    const { res, model } = await run({ dataClass: 'schema', feature: 'expressionGenerate', hostingClass: 'cloud' })
    expect(res.statusCode).toBe(200)
    expect(model.doGenerateCalls).toHaveLength(1)
  })
})
