import type { AiPolicy } from '@common/ai/policy'
import type { AiFeatureSwitches } from '@webapp/ai/engines/featureSwitches'
import { loadLocalServerConsent } from '@webapp/ai/engines/localServerConsent'
import {
  createModelResolver,
  type LocalServerConsentAnswer,
  type LocalServerConsentRequest,
  type ModelResolverDeps,
  type ResolveModelParams,
} from '@webapp/ai/engines/resolveModel'
import type { AiCapabilities, AiEngine, AiProviderEntry, StorageLike } from '@webapp/ai/engines/types'
import { resolveAssistantTurnModel } from '@webapp/ai/agent/turnModel'

const URL_A = 'http://localhost:1234/v1'

const memoryStorage = (): StorageLike => {
  const data = new Map<string, string>()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
}

const SETTINGS: AiFeatureSwitches = {
  featuresEnabled: true,
  featureToggles: { expressions: true, userActivity: true, dataQuery: true, assistantDesign: true },
  disabledFeatures: [],
}

const ACCOUNT: AiProviderEntry = {
  id: 'acct:a1',
  kind: 'account',
  type: 'openai',
  name: 'Mine',
  model: 'gateway-model',
  baseUrl: null,
  hostingClass: 'cloud',
  status: 'ready',
}

const capabilities = (defaultProviderId: string): AiCapabilities => ({
  instance: { policyCeilings: { schema: 'cloud', data: 'cloud' }, orgHostedBaseUrls: [], maxPromptChars: 1000 },
  providers: [
    ACCOUNT,
    {
      id: 'local:l1',
      kind: 'local',
      type: 'local',
      name: 'Local server',
      model: 'local-model',
      baseUrl: URL_A,
      hostingClass: 'onDevice',
      status: 'ready',
    },
  ],
  defaultProviderId,
  local: {
    'local:l1': {
      reachable: true,
      models: ['local-model'],
      hostingClass: 'onDevice',
      contextTokens: 4096,
      baseUrl: URL_A,
      modelId: 'local-model',
      error: null,
    },
  },
})

// what the assistant does: data tools are offered when the policy lets record data go to the engine's hosting class
const declareFor =
  () =>
  ({ policy }: { policy: AiPolicy | null }) =>
    policy && policy.data !== 'off' ? ('data' as const) : ('schema' as const)

type Setup = {
  answers?: LocalServerConsentAnswer[]
  // cached: the read before the turn; fresh: the re-check
  cached?: AiPolicy
  fresh?: () => AiPolicy
  onConsent?: () => void
  defaultProviderId?: string
}

const DEFAULT_POLICY: AiPolicy = { schema: 'cloud', data: 'onDevice' }

const setup = ({
  answers = ['continue'],
  cached = DEFAULT_POLICY,
  fresh = () => cached,
  onConsent,
  defaultProviderId = 'local:l1',
}: Setup = {}) => {
  const storage = memoryStorage()
  const requests: LocalServerConsentRequest[] = []
  const models: any[] = []
  const gateway: any[] = []
  const resolve = createModelResolver({
    getUserUuid: () => 'u1',
    isInstanceEnabled: () => true,
    getSettings: () => SETTINGS,
    loadCapabilities: async () => capabilities(defaultProviderId),
    getEffectivePolicyFor: async ({ fresh: isFresh }) => (isFresh ? fresh() : cached),
    storage,
    requestConsent: async (request) => {
      requests.push(request)
      onConsent?.()
      return answers.shift() ?? 'cancel'
    },
    onConsentChange: () => undefined,
    createGatewayModel: (options) => {
      gateway.push(options)
      return { id: 'gateway' } as any
    },
    createLocalEngine: async () =>
      ({
        createModel: (options: any) => {
          models.push(options)
          return { id: 'local' }
        },
      }) as unknown as AiEngine,
  } as ModelResolverDeps)
  const params: ResolveModelParams = {
    feature: 'assistantDesign',
    surveyId: 1,
    dataClass: 'schema',
    declareDataClass: declareFor(),
  }
  return { resolve, params, requests, models, gateway, storage }
}

describe('a turn that is offered data tools asks for the consent once, at the final class (375)', () => {
  test('default policy, on-device server: one request, with record data', async () => {
    const { resolve, params, requests, models, storage } = setup()
    const resolved = await resolve(params)
    expect(requests.map((request) => request.dataClass)).toEqual(['data'])
    expect(models.map((options) => options.dataClass)).toEqual(['data'])
    expect(resolved.policy).toEqual(DEFAULT_POLICY)
    expect(loadLocalServerConsent({ storage, userUuid: 'u1', surveyId: 1, baseUrl: URL_A, dataClass: 'data' })).toBe(
      'accepted'
    )
  })

  test('cancelling that one dialog leaves no consent behind', async () => {
    const { resolve, params, storage } = setup({ answers: ['cancel'] })
    const error = await resolve(params).catch((e) => e)
    expect(error.key).toBe('aiLocalServerConsentCancelled')
    expect(
      loadLocalServerConsent({ storage, userUuid: 'u1', surveyId: 1, baseUrl: URL_A, dataClass: 'schema' })
    ).toBeNull()
  })

  test('the next turn asks nothing: the consent for record data is stored', async () => {
    const { resolve, params, requests } = setup()
    await resolve(params)
    await resolve(params)
    expect(requests).toHaveLength(1)
  })

  test('the tools are chosen with the fresh policy the engine is re-checked with, not the cached one', async () => {
    // the cache still says record data may not leave the device; the server now allows it
    const { resolve, params, requests } = setup({
      cached: { schema: 'cloud', data: 'off' },
      fresh: () => ({ schema: 'cloud', data: 'onDevice' }),
    })
    const resolved = await resolve(params)
    expect(requests.map((request) => request.dataClass)).toEqual(['data'])
    expect(resolved.policy).toEqual({ schema: 'cloud', data: 'onDevice' })
  })

  test('the cache allows record data but the server just forbade it: the turn stays at the survey design', async () => {
    const { resolve, params, requests, models } = setup({
      cached: { schema: 'cloud', data: 'onDevice' },
      fresh: () => ({ schema: 'onDevice', data: 'off' }),
    })
    const resolved = await resolve(params)
    expect(requests.map((request) => request.dataClass)).toEqual(['schema'])
    expect(models.map((options) => options.dataClass)).toEqual(['schema'])
    expect(resolved.policy.data).toBe('off')
  })

  test('the policy now allows record data while the dialog was open: the consent does not cover it', async () => {
    let policy: AiPolicy = { schema: 'onDevice', data: 'off' }
    const { resolve, params, models, storage } = setup({
      cached: policy,
      fresh: () => policy,
      onConsent: () => {
        policy = { schema: 'onDevice', data: 'onDevice' }
      },
    })
    const error = await resolve(params).catch((e) => e)
    expect(error.key).toBe('aiLocalServerConsentCancelled')
    expect(models).toEqual([])
    expect(
      loadLocalServerConsent({ storage, userUuid: 'u1', surveyId: 1, baseUrl: URL_A, dataClass: 'schema' })
    ).toBeNull()
  })

  test('a gateway engine declares the class once, with the policy it was selected with', async () => {
    const { resolve, params, gateway, requests } = setup({
      defaultProviderId: 'acct:a1',
      cached: { schema: 'cloud', data: 'cloud' },
    })
    const resolved = await resolve(params)
    expect(requests).toEqual([])
    expect(gateway.map((options) => options.dataClass)).toEqual(['data'])
    expect(resolved.policy).toEqual({ schema: 'cloud', data: 'cloud' })
  })

  test('record data that no hosting class may receive fails with the policy reason, as before', async () => {
    const { resolve, params } = setup({
      defaultProviderId: 'acct:a1',
      // the account provider is cloud; data is allowed on the device only
      cached: { schema: 'cloud', data: 'onDevice' },
    })
    const error = await resolve(params).catch((e) => e)
    expect(error.key).toBe('aiNoEngineAvailable')
    expect(error.params.reasons).toEqual(['policyForbids'])
  })
})

describe('resolveAssistantTurnModel hands the declaration to the resolver (375)', () => {
  test('one resolver call; the declaration gives the class of the tools offered for the selected engine', async () => {
    const calls: ResolveModelParams[] = []
    const resolve = async (params: ResolveModelParams) => {
      calls.push(params)
      return { model: {}, engine: { hostingClass: 'onDevice' } as any, policy: DEFAULT_POLICY }
    }
    const seen: unknown[] = []
    await resolveAssistantTurnModel({
      params: { feature: 'assistantAnalysis', surveyId: 1, dataClass: 'schema' },
      getToolsForHosting: (hostingClass, policy) => {
        seen.push([hostingClass, policy])
        return [{ dataClass: 'data' }]
      },
      resolve,
    })
    expect(calls).toHaveLength(1)
    const declared = calls[0].declareDataClass!({ engine: { hostingClass: 'onDevice' } as any, policy: DEFAULT_POLICY })
    expect(declared).toBe('data')
    expect(seen).toEqual([['onDevice', DEFAULT_POLICY]])
  })

  test('without data tools the conversation class stays', async () => {
    const calls: ResolveModelParams[] = []
    await resolveAssistantTurnModel({
      params: { feature: 'assistantAnalysis', surveyId: 1, dataClass: 'schema' },
      getToolsForHosting: () => [{ dataClass: 'schema' }],
      resolve: async (params) => {
        calls.push(params)
        return { model: {}, engine: {} as any }
      },
    })
    expect(calls[0].declareDataClass!({ engine: { hostingClass: 'cloud' } as any, policy: DEFAULT_POLICY })).toBe(
      'schema'
    )
  })
})
