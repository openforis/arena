import type { AiPolicy } from '@common/ai/policy'
import type { AiFeatureSwitches } from '@webapp/ai/engines/featureSwitches'
import { loadLocalServerConsent } from '@webapp/ai/engines/localServerConsent'
import {
  createModelResolver,
  type LocalServerConsentAnswer,
  type ModelResolverDeps,
} from '@webapp/ai/engines/resolveModel'
import type { AiCapabilities, AiEngine, AiProviderEntry, StorageLike } from '@webapp/ai/engines/types'

const memoryStorage = (): StorageLike => {
  const data = new Map<string, string>()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
}

const SETTINGS: AiFeatureSwitches = {
  featuresEnabled: true,
  featureToggles: { expressions: true, userActivity: true, dataQuery: true, assistantDesign: true },
  disabledFeatures: [],
}
const URL_A = 'http://localhost:1234/v1'
const URL_B = 'http://localhost:5678/v1'

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

const capabilities = (baseUrl: string): AiCapabilities => ({
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
      status: 'ready',
    },
  ],
  defaultProviderId: 'local:l1',
  local: {
    'local:l1': {
      enabled: true,
      reachable: true,
      models: ['local-model'],
      hostingClass: 'onDevice',
      contextTokens: 4096,
      baseUrl,
      modelId: 'local-model',
      error: null,
    },
  },
})

type Setup = {
  answers?: LocalServerConsentAnswer[]
  // read each time: tests change it while the consent dialog is open; fresh: the read is not from the cache
  policy?: (fresh: boolean) => AiPolicy
  baseUrl?: () => string
  onConsent?: () => void
  defaultProviderId?: string
}

const setup = ({
  answers = [],
  policy = (): AiPolicy => ({ schema: 'cloud', data: 'onDevice' }),
  baseUrl = () => URL_A,
  onConsent,
  defaultProviderId,
}: Setup = {}) => {
  const storage = memoryStorage()
  const state = {
    policyCalls: [] as { surveyId?: number; fresh: boolean }[],
    gatewayCalls: [] as unknown[],
    localEngines: [] as (string | null)[],
    consentChanges: 0,
  }
  const resolve = createModelResolver({
    getUserUuid: () => 'u1',
    isInstanceEnabled: () => true,
    getSettings: () => SETTINGS,
    loadCapabilities: async () => ({ ...capabilities(baseUrl()), ...(defaultProviderId ? { defaultProviderId } : {}) }),
    getEffectivePolicyFor: async ({ surveyId, fresh }) => {
      state.policyCalls.push({ surveyId, fresh: fresh === true })
      return policy(fresh === true)
    },
    storage,
    requestConsent: async () => {
      onConsent?.()
      return answers.shift() ?? 'cancel'
    },
    onConsentChange: () => {
      state.consentChanges += 1
    },
    createGatewayModel: (options) => {
      state.gatewayCalls.push(options)
      return { id: 'gateway' } as any
    },
    createLocalEngine: async (localServer) => {
      state.localEngines.push(localServer.baseUrl)
      return { id: 'localServer', createModel: () => ({ id: 'local' }) } as unknown as AiEngine
    },
  } as ModelResolverDeps)
  return { resolve, state, storage }
}

describe('resolveModel: the last policy check before a local engine is created (363)', () => {
  test('after the consent dialog the policy is read again, uncached', async () => {
    const { resolve, state, storage } = setup({ answers: ['continue'] })
    await resolve({ feature: 'activityLogSummary', surveyId: 1 }).catch(() => undefined)
    // activityLogSummary needs record data: onDevice is allowed by the default policy
    expect(state.policyCalls).toEqual([
      { surveyId: 1, fresh: false },
      { surveyId: 1, fresh: true },
    ])
    expect(state.localEngines).toEqual([URL_A])
    expect(loadLocalServerConsent({ storage, userUuid: 'u1', surveyId: 1, baseUrl: URL_A })).toBe('accepted')
  })

  test('a policy that forbids the engine while the dialog was open fails closed and stores nothing', async () => {
    let policy: AiPolicy = { schema: 'cloud', data: 'onDevice' }
    const { resolve, state, storage } = setup({
      answers: ['continue'],
      // the first read is the one before the dialog
      policy: () => policy,
      onConsent: () => {
        policy = { schema: 'cloud', data: 'off' }
      },
    })
    const error = await resolve({ feature: 'activityLogSummary', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiNoEngineAvailable')
    expect(error.params.reasons).toEqual(['policyForbids'])
    expect(state.localEngines).toEqual([])
    expect(state.consentChanges).toBe(0)
    expect(loadLocalServerConsent({ storage, userUuid: 'u1', surveyId: 1, baseUrl: URL_A })).toBeNull()
  })

  test('an engine already consented to is also checked against the fresh policy', async () => {
    // the cache still holds the policy from before the administrator forbade record data
    let forbidden = false
    const { resolve, state } = setup({
      answers: ['continue'],
      policy: (fresh) => ({ schema: 'cloud', data: forbidden && fresh ? 'off' : 'onDevice' }),
    })
    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    state.policyCalls.length = 0
    forbidden = true
    const error = await resolve({ feature: 'activityLogSummary', surveyId: 1 }).catch((e) => e)
    expect(error.params.reasons).toEqual(['policyForbids'])
    expect(state.policyCalls).toEqual([
      { surveyId: 1, fresh: false },
      { surveyId: 1, fresh: true },
    ])
    expect(state.localEngines).toEqual([URL_A])
  })

  test('the address changed while the dialog was open: the consent does not cover it', async () => {
    let baseUrl = URL_A
    const { resolve, state, storage } = setup({
      answers: ['continue'],
      baseUrl: () => baseUrl,
      onConsent: () => {
        baseUrl = URL_B
      },
    })
    const error = await resolve({ feature: 'activityLogSummary', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiLocalServerConsentCancelled')
    expect(state.localEngines).toEqual([])
    for (const url of [URL_A, URL_B]) {
      expect(loadLocalServerConsent({ storage, userUuid: 'u1', surveyId: 1, baseUrl: url })).toBeNull()
    }
  })

  test('a gateway engine is not re-read: the server checks the policy of every call', async () => {
    const { resolve, state } = setup({ defaultProviderId: 'acct:a1' })
    await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(state.policyCalls).toEqual([{ surveyId: 1, fresh: false }])
  })
})

describe('resolveModel: the policy of the turn is the one the engine was selected with (364)', () => {
  test('a gateway engine returns the policy it was selected with', async () => {
    const { resolve } = setup({ defaultProviderId: 'acct:a1', policy: () => ({ schema: 'cloud', data: 'orgHosted' }) })
    const { policy } = await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(policy).toEqual({ schema: 'cloud', data: 'orgHosted' })
  })

  test('a local engine returns the fresh policy of the re-check, not the cached one', async () => {
    const { resolve } = setup({
      answers: ['continue'],
      policy: (fresh) => (fresh ? { schema: 'onDevice', data: 'onDevice' } : { schema: 'cloud', data: 'onDevice' }),
    })
    const { policy } = await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(policy).toEqual({ schema: 'onDevice', data: 'onDevice' })
  })
})

describe('resolveModel: the feature minimum data class (363)', () => {
  test('a caller cannot lower the data class of a feature that needs record data', async () => {
    const { resolve, state } = setup({ defaultProviderId: 'acct:a1' })
    const error = await resolve({ feature: 'activityLogSummary', surveyId: 1, dataClass: 'schema' }).catch((e) => e)
    // the default policy keeps record data on the device: an account (cloud) provider is refused
    expect(error.key).toBe('aiNoEngineAvailable')
    expect(error.params).toEqual({ reasons: ['policyForbids'], dataClass: 'data' })
    expect(state.gatewayCalls).toEqual([])
  })

  test('the class sent to the gateway is the raised one', async () => {
    const { resolve, state } = setup({
      defaultProviderId: 'acct:a1',
      policy: () => ({ schema: 'cloud', data: 'cloud' }),
    })
    await resolve({ feature: 'activityLogSummary', surveyId: 1, dataClass: 'schema' })
    expect(state.gatewayCalls).toEqual([
      { feature: 'activityLogSummary', dataClass: 'data', surveyId: 1, providerId: 'acct:a1' },
    ])
  })

  test('a variable feature keeps the class the caller declares', async () => {
    const { resolve, state } = setup({
      defaultProviderId: 'acct:a1',
      policy: () => ({ schema: 'cloud', data: 'cloud' }),
    })
    await resolve({ feature: 'assistantDesign' as any, surveyId: 1, dataClass: 'data' })
    await resolve({ feature: 'assistantDesign' as any, surveyId: 1 })
    expect(state.gatewayCalls.map((call: any) => call.dataClass)).toEqual(['data', 'schema'])
  })
})
