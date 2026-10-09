import type { AiPolicy } from '@common/ai/policy'
import { loadLocalServerConsent } from '@webapp/ai/engines/localServerConsent'
import { defaultLocalServerSettings } from '@webapp/ai/engines/localServerSettings'
import {
  createModelResolver,
  type LocalServerConsentAnswer,
  type LocalServerConsentRequest,
} from '@webapp/ai/engines/resolveModel'
import type { AiCapabilities, AiEngine, AiLocalServerSettings, StorageLike } from '@webapp/ai/engines/types'

const memoryStorage = (): StorageLike => {
  const data = new Map<string, string>()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
}

const DEFAULT_POLICY: AiPolicy = { schema: 'cloud', data: 'onDevice' }
const BASE_URL = 'http://localhost:1234/v1'

const capabilities = ({
  localEnabled,
  baseUrl = BASE_URL,
}: {
  localEnabled: boolean
  baseUrl?: string
}): AiCapabilities => ({
  localServer: {
    enabled: localEnabled,
    reachable: localEnabled ? true : null,
    models: localEnabled ? ['local-model'] : [],
    hostingClass: localEnabled ? 'onDevice' : null,
    contextTokens: 4096,
    baseUrl: localEnabled ? baseUrl : null,
    modelId: 'local-model',
    error: null,
  },
  gateway: { available: true, hostingClass: 'cloud', provider: 'openai', model: 'gateway-model', maxPromptChars: 1000 },
  device: { webGpu: false, deviceMemoryGb: null, promptApi: null },
  instance: { policyCeilings: { schema: 'cloud', data: 'cloud' }, orgHostedBaseUrls: [] },
})

const setup = ({
  localEnabled = true,
  policy = DEFAULT_POLICY,
  answers = [] as LocalServerConsentAnswer[],
  userUuid = 'u1' as string | null,
  withStorage = true,
} = {}) => {
  const storage = memoryStorage()
  const localSettings: AiLocalServerSettings = {
    ...defaultLocalServerSettings(),
    enabled: localEnabled,
    modelId: 'local-model',
  }
  const state = {
    baseUrl: BASE_URL,
    policy: policy as AiPolicy | null,
    requests: [] as LocalServerConsentRequest[],
    policyCalls: [] as (number | undefined)[],
    gatewayCalls: [] as unknown[],
    localEngines: 0,
    consentChanges: 0,
  }
  const gatewayModel = { id: 'gateway' } as any
  const localModel = { id: 'local' } as any
  const resolve = createModelResolver({
    getUserUuid: () => userUuid,
    loadCapabilities: async () => capabilities({ localEnabled, baseUrl: state.baseUrl }),
    getEffectivePolicy: async (surveyId) => {
      state.policyCalls.push(surveyId)
      return state.policy
    },
    getLocalSettings: () => localSettings,
    storage: withStorage ? storage : null,
    requestConsent: async (request) => {
      state.requests.push(request)
      return answers.shift() ?? 'cancel'
    },
    onConsentChange: () => {
      state.consentChanges += 1
    },
    createGatewayModel: (options) => {
      state.gatewayCalls.push(options)
      return gatewayModel
    },
    createLocalEngine: async (localServer) => {
      state.localEngines += 1
      return { id: 'localServer', createModel: () => localModel, baseUrl: localServer.baseUrl } as unknown as AiEngine
    },
  })
  return { resolve, state, storage, gatewayModel, localModel }
}

describe('createModelResolver', () => {
  test('gateway for a schema feature when the local server is off', async () => {
    const { resolve, state, gatewayModel } = setup({ localEnabled: false })
    const { model, engine } = await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(model).toBe(gatewayModel)
    expect(engine).toEqual({
      id: 'gateway',
      hostingClass: 'cloud',
      label: 'openai',
      model: 'gateway-model',
      limits: { maxPromptChars: 1000, maxSteps: 10 },
    })
    expect(state.gatewayCalls).toEqual([{ feature: 'expressionExplain', dataClass: 'schema', surveyId: 1 }])
    expect(state.policyCalls).toEqual([1])
  })

  test('the caller can raise the data class', async () => {
    const { resolve, state } = setup({ localEnabled: false, policy: { schema: 'cloud', data: 'cloud' } })
    await resolve({ feature: 'assistantDesign' as any, surveyId: 1, dataClass: 'data' })
    expect(state.gatewayCalls).toEqual([{ feature: 'assistantDesign', dataClass: 'data', surveyId: 1 }])
  })

  test('no engine: aiNoEngineAvailable with the reasons and the data class', async () => {
    const { resolve } = setup({ localEnabled: false })
    const error = await resolve({ feature: 'activityLogSummary', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiNoEngineAvailable')
    expect(error.statusCode).toBe(409)
    expect(error.params).toEqual({ reasons: ['localServerNotEnabled', 'policyForbidsCloud'], dataClass: 'data' })
  })

  test('first use of the local server asks once per survey; Continue is remembered', async () => {
    const { resolve, state, storage, localModel } = setup({ answers: ['continue'] })
    const first = await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(first.model).toBe(localModel)
    expect(first.engine.id).toBe('localServer')
    expect(state.requests).toEqual([
      { surveyId: 1, baseUrl: BASE_URL, modelId: 'local-model', hostingClass: 'onDevice', canUseOther: false },
    ])
    expect(state.consentChanges).toBe(1)
    expect(loadLocalServerConsent({ storage, userUuid: 'u1', surveyId: 1, baseUrl: BASE_URL })).toBe('accepted')

    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(state.requests.length).toBe(1)
    expect(state.localEngines).toBe(2)

    // another survey asks again (answers exhausted → cancel)
    const error = await resolve({ feature: 'activityLogSummary', surveyId: 2 }).catch((e) => e)
    expect(error.key).toBe('aiLocalServerConsentCancelled')
    expect(state.requests.length).toBe(2)
  })

  test('Use another engine switches the survey to the gateway, without asking again', async () => {
    const { resolve, state, gatewayModel } = setup({ answers: ['useOther'] })
    const first = await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(state.requests[0].canUseOther).toBe(true)
    expect(first.model).toBe(gatewayModel)
    expect(first.engine.id).toBe('gateway')

    const second = await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(second.engine.id).toBe('gateway')
    expect(state.requests.length).toBe(1)
    expect(state.localEngines).toBe(0)
  })

  test('after a decline, the card is shown again when only the local server qualifies', async () => {
    const { resolve, state } = setup({ answers: ['useOther', 'continue'] })
    await resolve({ feature: 'expressionExplain', surveyId: 1 })
    state.policy = { schema: 'onDevice', data: 'onDevice' }
    const { engine } = await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(state.requests.length).toBe(2)
    expect(state.requests[1].canUseOther).toBe(false)
    expect(engine.id).toBe('localServer')
  })

  test('closing the card cancels the request', async () => {
    const { resolve, state } = setup({ answers: ['cancel'] })
    const error = await resolve({ feature: 'activityLogSummary', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiLocalServerConsentCancelled')
    expect(state.localEngines).toBe(0)
    expect(state.consentChanges).toBe(0)
  })

  test('Use another engine without an alternative cancels', async () => {
    const { resolve } = setup({ answers: ['useOther'] })
    const error = await resolve({ feature: 'activityLogSummary', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiLocalServerConsentCancelled')
  })

  test('without a survey the policy is read for no survey (ceilings)', async () => {
    const { resolve, state } = setup({ localEnabled: false })
    await resolve({ feature: 'chatbot' })
    expect(state.policyCalls).toEqual([undefined])
  })

  test('an unknown feature is treated as data (fails closed)', async () => {
    const { resolve } = setup({ localEnabled: false })
    const error = await resolve({ feature: 'unknownFeature' as any, surveyId: 1 }).catch((e) => e)
    expect(error.params.dataClass).toBe('data')
  })

  test('a null policy fails closed with policyForbidsAll', async () => {
    const { resolve } = setup({ policy: null as any })
    const error = await resolve({ feature: 'expressionExplain', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiNoEngineAvailable')
    expect(error.params.reasons).toEqual(['policyForbidsAll'])
  })

  test('without a survey (Help) the card is asked once, then remembered', async () => {
    const { resolve, state } = setup({ answers: ['continue'] })
    await resolve({ feature: 'chatbot' })
    await resolve({ feature: 'chatbot' })
    expect(state.requests.length).toBe(1)
    expect(state.requests[0].surveyId).toBeUndefined()
  })

  test('a changed server address asks again although the old one was accepted', async () => {
    const { resolve, state } = setup({ answers: ['continue', 'continue'] })
    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    state.baseUrl = 'http://localhost:5678/v1'
    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(state.requests.map((r) => r.baseUrl)).toEqual([BASE_URL, 'http://localhost:5678/v1'])
  })

  test('after Use another engine the engine is the gateway one with its limits', async () => {
    const { resolve } = setup({ answers: ['useOther'] })
    const { engine } = await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(engine.hostingClass).toBe('cloud')
    expect(engine.limits).toEqual({ maxPromptChars: 1000, maxSteps: 10 })
  })

  test.each([
    ['no storage', { withStorage: false }],
    ['no user', { userUuid: null }],
  ])('%s: the card is asked on every request', async (_name, options) => {
    const { resolve, state } = setup({ answers: ['continue', 'continue'], ...options })
    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(state.requests.length).toBe(2)
  })
})
