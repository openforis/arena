import type { AiPolicy } from '@common/ai/policy'
import type { AiFeatureSwitches } from '@webapp/ai/engines/featureSwitches'
import { loadLocalServerConsent, saveLocalServerConsent } from '@webapp/ai/engines/localServerConsent'
import {
  createModelResolver,
  type LocalServerConsentAnswer,
  type LocalServerConsentRequest,
  type ModelResolverDeps,
} from '@webapp/ai/engines/resolveModel'
import type { AiCapabilities, AiEngine, AiProviderEntry, StorageLike } from '@webapp/ai/engines/types'

/** Builds an in-memory storage. */
const memoryStorage = (): StorageLike => {
  const data = new Map<string, string>()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
}

const ON_SETTINGS: AiFeatureSwitches = {
  featuresEnabled: true,
  featureToggles: { expressions: true, chat: true, dataQuery: true, userActivity: true, assistantDesign: true },
  disabledFeatures: [],
}
const DEFAULT_POLICY: AiPolicy = { schema: 'cloud', data: 'onDevice' }
const BASE_URL = 'http://localhost:1234/v1'

const ACCOUNT: AiProviderEntry = {
  id: 'acct:a1',
  kind: 'account',
  type: 'openai',
  name: 'My OpenAI',
  model: 'gateway-model',
  baseUrl: null,
  hostingClass: 'cloud',
  status: 'ready',
}
const ARENA: AiProviderEntry = {
  id: 'arena-default',
  kind: 'arenaDefault',
  type: 'openai',
  name: 'Arena default',
  model: 'admin-model',
  baseUrl: null,
  hostingClass: 'cloud',
  status: 'ready',
}

/** Builds capabilities with the given provider list and default. */
const capabilities = ({
  defaultProviderId,
  baseUrl,
  localUp,
}: {
  defaultProviderId: string
  baseUrl: string
  localUp: boolean
}): AiCapabilities => ({
  instance: { policyCeilings: { schema: 'cloud', data: 'cloud' }, orgHostedBaseUrls: [], maxPromptChars: 1000 },
  providers: [
    ACCOUNT,
    {
      id: 'local:l1',
      kind: 'local',
      type: 'local',
      name: 'Local server',
      model: 'local-model',
      baseUrl,
      hostingClass: 'onDevice',
      status: localUp ? 'ready' : 'notAvailable',
    },
    ARENA,
  ],
  defaultProviderId,
  local: {
    'local:l1': {
      enabled: true,
      reachable: localUp,
      models: ['local-model'],
      hostingClass: 'onDevice',
      contextTokens: 4096,
      baseUrl,
      modelId: 'local-model',
      error: null,
    },
  },
})

/** Builds a model resolver over the capabilities, recording every call. */
const setup = ({
  defaultProviderId = 'local:l1',
  localUp = true,
  policy = DEFAULT_POLICY,
  answers = [] as LocalServerConsentAnswer[],
  userUuid = 'u1' as string | null,
  withStorage = true,
  settings = ON_SETTINGS as AiFeatureSwitches | null,
  instanceEnabled = true,
  requestConsent = undefined as ModelResolverDeps['requestConsent'] | undefined,
} = {}) => {
  const currentUser = { uuid: userUuid }
  const storage = memoryStorage()
  const state = {
    baseUrl: BASE_URL,
    policy: policy as AiPolicy | null,
    requests: [] as LocalServerConsentRequest[],
    policyCalls: [] as (number | undefined)[],
    gatewayCalls: [] as unknown[],
    localEngines: [] as (string | null)[],
    consentChanges: 0,
  }
  const gatewayModel = { id: 'gateway' } as any
  const localModel = { id: 'local' } as any
  const resolve = createModelResolver({
    getUserUuid: () => currentUser.uuid,
    isInstanceEnabled: () => instanceEnabled,
    getSettings: () => settings,
    loadCapabilities: async () => capabilities({ defaultProviderId, baseUrl: state.baseUrl, localUp }),
    getEffectivePolicy: async ({ surveyId, fresh }) => {
      // the first read may come from the cache; the one before a local model is created never does
      if (!fresh) state.policyCalls.push(surveyId)
      return state.policy
    },
    storage: withStorage ? storage : null,
    requestConsent:
      requestConsent ??
      (async (request) => {
        state.requests.push(request)
        return answers.shift() ?? 'cancel'
      }),
    onConsentChange: () => {
      state.consentChanges += 1
    },
    createGatewayModel: (options) => {
      state.gatewayCalls.push(options)
      return gatewayModel
    },
    createLocalEngine: async (localServer) => {
      state.localEngines.push(localServer.baseUrl)
      return { id: 'localServer', createModel: () => localModel } as unknown as AiEngine
    },
  })
  return { resolve, state, storage, gatewayModel, localModel, currentUser }
}

describe('createModelResolver', () => {
  test('gateway for an account default, named by its providerId', async () => {
    const { resolve, state, gatewayModel } = setup({ defaultProviderId: 'acct:a1' })
    const { model, engine } = await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(model).toBe(gatewayModel)
    expect(engine).toEqual({
      id: 'gateway',
      hostingClass: 'cloud',
      label: 'My OpenAI',
      model: 'gateway-model',
      limits: { maxPromptChars: 1000, maxSteps: 10 },
      providerId: 'acct:a1',
    })
    expect(state.gatewayCalls).toEqual([
      { feature: 'expressionExplain', dataClass: 'schema', surveyId: 1, providerId: 'acct:a1' },
    ])
    expect(state.policyCalls).toEqual([1])
  })

  test('the caller can raise the data class', async () => {
    const { resolve, state } = setup({ defaultProviderId: 'acct:a1', policy: { schema: 'cloud', data: 'cloud' } })
    await resolve({ feature: 'assistantDesign' as any, surveyId: 1, dataClass: 'data' })
    expect(state.gatewayCalls).toEqual([
      { feature: 'assistantDesign', dataClass: 'data', surveyId: 1, providerId: 'acct:a1' },
    ])
  })

  test("the request's provider wins over the default", async () => {
    const { resolve, state } = setup()
    const { engine } = await resolve({ feature: 'expressionExplain', surveyId: 1, providerId: 'arena-default' })
    expect(engine.label).toBe('openai')
    expect(state.gatewayCalls).toEqual([
      { feature: 'expressionExplain', dataClass: 'schema', surveyId: 1, providerId: 'arena-default' },
    ])
    expect(state.requests).toEqual([])
  })

  test('no engine: aiNoEngineAvailable with the reason and the data class', async () => {
    const { resolve } = setup({ defaultProviderId: 'acct:a1' })
    const error = await resolve({ feature: 'activityLogSummary', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiNoEngineAvailable')
    expect(error.statusCode).toBe(409)
    expect(error.params).toEqual({ reasons: ['policyForbids'], dataClass: 'data' })
  })

  test('an unreachable default is never replaced by another provider', async () => {
    const { resolve, state } = setup({ localUp: false })
    const error = await resolve({ feature: 'expressionExplain', surveyId: 1 }).catch((e) => e)
    expect(error.params.reasons).toEqual(['notAvailable'])
    expect(state.gatewayCalls).toEqual([])
    expect(state.requests).toEqual([])
  })

  test('first use of a local provider asks once per survey; Continue is remembered', async () => {
    const { resolve, state, storage, localModel } = setup({ answers: ['continue'] })
    const first = await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(first.model).toBe(localModel)
    expect(first.engine.providerId).toBe('local:l1')
    expect(state.requests).toEqual([
      { surveyId: 1, baseUrl: BASE_URL, modelId: 'local-model', hostingClass: 'onDevice' },
    ])
    expect(state.consentChanges).toBe(1)
    expect(loadLocalServerConsent({ storage, userUuid: 'u1', surveyId: 1, baseUrl: BASE_URL })).toBe('accepted')

    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(state.requests.length).toBe(1)
    expect(state.localEngines).toEqual([BASE_URL, BASE_URL])

    // another survey asks again (answers exhausted → cancel)
    const error = await resolve({ feature: 'activityLogSummary', surveyId: 2 }).catch((e) => e)
    expect(error.key).toBe('aiLocalServerConsentCancelled')
    expect(state.requests.length).toBe(2)
  })

  test('a decline stored by the old dialog asks again', async () => {
    const { resolve, state, storage } = setup({ answers: ['continue'] })
    saveLocalServerConsent({ storage, userUuid: 'u1', surveyId: 1, baseUrl: BASE_URL, decision: 'declined' })
    const { engine } = await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(state.requests.length).toBe(1)
    expect(engine.id).toBe('localServer')
  })

  test('Choose another provider fails the request: no other provider is tried', async () => {
    const { resolve, state } = setup({ answers: ['chooseOther'] })
    const error = await resolve({ feature: 'expressionExplain', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiProviderChooseAnother')
    expect(state.gatewayCalls).toEqual([])
    expect(state.localEngines).toEqual([])
  })

  test('closing the card cancels the request', async () => {
    const { resolve, state } = setup({ answers: ['cancel'] })
    const error = await resolve({ feature: 'activityLogSummary', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiLocalServerConsentCancelled')
    expect(state.localEngines).toEqual([])
    expect(state.consentChanges).toBe(0)
  })

  test('without a survey the policy is read for no survey (ceilings)', async () => {
    const { resolve, state } = setup({ defaultProviderId: 'acct:a1' })
    await resolve({ feature: 'chatbot' })
    expect(state.policyCalls).toEqual([undefined])
  })

  test('an unknown feature fails closed (it belongs to no enabled category)', async () => {
    const { resolve } = setup({ defaultProviderId: 'acct:a1' })
    const error = await resolve({ feature: 'unknownFeature' as any, surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiFeaturesDisabled')
  })

  test('a null policy fails closed with policyForbids', async () => {
    const { resolve } = setup({ policy: null as any })
    const error = await resolve({ feature: 'expressionExplain', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiNoEngineAvailable')
    expect(error.params.reasons).toEqual(['policyForbids'])
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

  test.each([
    ['no storage', { withStorage: false }],
    ['no user', { userUuid: null }],
  ])('%s: the card is asked on every request', async (_name, options) => {
    const { resolve, state } = setup({ answers: ['continue', 'continue'], ...options })
    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(state.requests.length).toBe(2)
  })

  describe('the AI switches', () => {
    const FEATURE = 'activityLogSummary'
    const cases: [string, Parameters<typeof setup>[0]][] = [
      ['the user switch is off', { settings: { ...ON_SETTINGS, featuresEnabled: false } }],
      ['the category toggle is off', { settings: { ...ON_SETTINGS, featureToggles: {} } }],
      ['the feature is disabled on the server', { settings: { ...ON_SETTINGS, disabledFeatures: [FEATURE] } }],
      ['the instance switch is off', { instanceEnabled: false }],
      ['the settings failed to load', { settings: null }],
    ]

    test.each(cases)('%s: rejects even with a reachable local server', async (_name, options) => {
      const { resolve, state } = setup({ answers: ['continue'], ...options })
      const error = await resolve({ feature: FEATURE, surveyId: 1 }).catch((e) => e)
      expect(error.key).toBe('aiFeaturesDisabled')
      expect(state.requests).toEqual([])
      expect(state.localEngines).toEqual([])
      expect(state.gatewayCalls).toEqual([])
    })
  })

  describe('user change and abort during the consent', () => {
    test('another user after the dialog: cancelled, nothing is stored', async () => {
      let switchUser: () => void = () => undefined
      const { resolve, state, storage, currentUser } = setup({
        requestConsent: async () => {
          switchUser()
          return 'continue'
        },
      })
      switchUser = () => {
        currentUser.uuid = 'u2'
      }
      const error = await resolve({ feature: 'activityLogSummary', surveyId: 1 }).catch((e) => e)
      expect(error.key).toBe('aiLocalServerConsentCancelled')
      for (const userUuid of ['u1', 'u2']) {
        expect(loadLocalServerConsent({ storage, userUuid, surveyId: 1, baseUrl: BASE_URL })).toBeNull()
      }
      expect(state.consentChanges).toBe(0)
      expect(state.localEngines).toEqual([])
    })

    test('abort while the dialog is open: the request is cancelled and the resolve rejects as an abort', async () => {
      const controller = new AbortController()
      let received: AbortSignal | undefined
      const { resolve, state } = setup({
        requestConsent: (_request, signal) =>
          new Promise((resolveAnswer) => {
            received = signal
            signal?.addEventListener('abort', () => resolveAnswer('cancel'))
          }),
      })
      const pending = resolve({ feature: 'activityLogSummary', surveyId: 1, signal: controller.signal })
      await new Promise((done) => setTimeout(done, 0))
      controller.abort()
      const error = await pending.catch((e) => e)
      expect(received).toBe(controller.signal)
      expect(error.name).toBe('AbortError')
      expect(state.localEngines).toEqual([])
    })
  })
})
