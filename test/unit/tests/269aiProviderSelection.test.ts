import type { AiPolicy } from '@common/ai/policy'

import { getAiUnavailableActions } from '@webapp/ai/engines/engineUi'
import { getAiEngineFeatureAvailability } from '@webapp/ai/engines/featureAvailability'
import type { AiFeatureSwitches } from '@webapp/ai/engines/featureSwitches'
import {
  createModelResolver,
  type LocalServerConsentAnswer,
  type LocalServerConsentRequest,
} from '@webapp/ai/engines/resolveModel'
import { getEffectiveProviderId, selectEngine } from '@webapp/ai/engines/selectEngine'
import type {
  AiCapabilities,
  AiEngine,
  AiLocalServerCapability,
  AiProviderEntry,
  StorageLike,
} from '@webapp/ai/engines/types'

const CLOUD: AiPolicy = { schema: 'cloud', data: 'cloud' }
const LOCAL_URL = 'http://localhost:1234/v1'

const ON_SETTINGS: AiFeatureSwitches = {
  featuresEnabled: true,
  featureToggles: { expressions: true, chat: true, dataQuery: true, userActivity: true, assistantDesign: true },
  disabledFeatures: [],
}

const ACCOUNT: AiProviderEntry = {
  id: 'acct:a1',
  kind: 'account',
  type: 'openai',
  name: 'My OpenAI',
  model: 'gpt-x',
  baseUrl: null,
  hostingClass: 'cloud',
  status: 'ready',
}
const LOCAL: AiProviderEntry = {
  id: 'local:l1',
  kind: 'local',
  type: 'local',
  name: 'Desk server',
  model: 'local-model',
  baseUrl: LOCAL_URL,
  hostingClass: 'onDevice',
  status: 'ready',
}
const ARENA: AiProviderEntry = {
  id: 'arena-default',
  kind: 'arenaDefault',
  type: 'anthropic',
  name: 'Arena default',
  model: 'admin-model',
  baseUrl: null,
  hostingClass: 'cloud',
  status: 'ready',
}
const ARENA_NOT_SET_UP: AiProviderEntry = {
  ...ARENA,
  type: 'arena-default',
  model: null,
  hostingClass: null,
  status: 'notSetUp',
}

const PROBE: AiLocalServerCapability = {
  reachable: true,
  models: ['local-model'],
  hostingClass: 'onDevice',
  contextTokens: 8192,
  baseUrl: LOCAL_URL,
  modelId: 'local-model',
  error: null,
}

/** Builds capabilities with the given provider list and default. */
const capabilities = ({
  providers = [ACCOUNT, LOCAL, ARENA],
  defaultProviderId = 'acct:a1',
}: { providers?: AiProviderEntry[]; defaultProviderId?: string } = {}): AiCapabilities => ({
  instance: { policyCeilings: CLOUD, orgHostedBaseUrls: [], maxPromptChars: 150000 },
  providers,
  defaultProviderId,
  local: providers.some((entry) => entry.id === LOCAL.id) ? { [LOCAL.id]: PROBE } : {},
})

/** Builds an in-memory storage. */
const memoryStorage = (): StorageLike => {
  const data = new Map<string, string>()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
}

/** Builds a model resolver over the capabilities, recording every gateway, local and consent call. */
const setupResolver = (caps: AiCapabilities, answers: LocalServerConsentAnswer[] = []) => {
  const state = {
    gatewayCalls: [] as unknown[],
    localServers: [] as (string | null)[],
    requests: [] as LocalServerConsentRequest[],
  }
  const resolve = createModelResolver({
    getUserUuid: () => 'u1',
    isInstanceEnabled: () => true,
    getSettings: () => ON_SETTINGS,
    loadCapabilities: async () => caps,
    getEffectivePolicyFor: async () => CLOUD,
    storage: memoryStorage(),
    requestConsent: async (request) => {
      state.requests.push(request)
      return answers.shift() ?? 'cancel'
    },
    onConsentChange: () => undefined,
    createGatewayModel: (options) => {
      state.gatewayCalls.push(options)
      return { id: 'gateway' } as any
    },
    createLocalEngine: async (localServer) => {
      state.localServers.push(localServer.baseUrl)
      return { createModel: () => ({ id: 'local' }) } as unknown as AiEngine
    },
  })
  return { resolve, state }
}

describe('single-provider selection (269)', () => {
  test("the conversation's provider when it still exists, else the default", () => {
    const caps = capabilities()
    expect(getEffectiveProviderId({ capabilities: caps, providerId: 'local:l1' })).toBe('local:l1')
    expect(getEffectiveProviderId({ capabilities: caps, providerId: 'acct:removed' })).toBe('acct:a1')
    expect(getEffectiveProviderId({ capabilities: caps, providerId: 'local:other-browser' })).toBe('acct:a1')
    expect(getEffectiveProviderId({ capabilities: caps })).toBe('acct:a1')
  })

  test('a local default missing on this browser is missingOnThisBrowser, never another provider', async () => {
    const caps = capabilities({ providers: [ACCOUNT, ARENA], defaultProviderId: 'local:desk-at-home' })
    expect(selectEngine({ effective: CLOUD, dataClass: 'schema', capabilities: caps })).toEqual({
      unavailable: ['missingOnThisBrowser'],
    })

    const availability = getAiEngineFeatureAvailability({
      enabled: true,
      effective: CLOUD,
      dataClass: 'schema',
      surveyScoped: true,
      capabilities: caps,
    })
    expect(availability.status).toBe('noEngine')
    expect(availability.reasonKeys).toEqual(['aiEngine.unavailable.missingOnThisBrowser'])
    expect(getAiUnavailableActions({ reasons: availability.reasons, canChangePolicy: true })).toEqual(['openSettings'])

    const { resolve, state } = setupResolver(caps, ['continue'])
    const error = await resolve({ feature: 'expressionExplain', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiNoEngineAvailable')
    expect(error.params).toEqual({ reasons: ['missingOnThisBrowser'], dataClass: 'schema' })
    expect(state.gatewayCalls).toEqual([])
    expect(state.localServers).toEqual([])
    expect(state.requests).toEqual([])
  })

  test('the policy is checked before availability', () => {
    const caps = capabilities({ providers: [{ ...ACCOUNT, status: 'notAvailable' }, ARENA] })
    const effective: AiPolicy = { schema: 'onDevice', data: 'onDevice' }
    expect(selectEngine({ effective, dataClass: 'schema', capabilities: caps })).toEqual({
      unavailable: ['policyForbids'],
    })
    const availability = getAiEngineFeatureAvailability({
      enabled: true,
      effective,
      dataClass: 'schema',
      surveyScoped: true,
      capabilities: caps,
    })
    expect(availability.status).toBe('policyBlocked')
    expect(selectEngine({ effective: CLOUD, dataClass: 'schema', capabilities: caps })).toEqual({
      unavailable: ['notAvailable'],
    })
  })

  test('Arena default without an admin default is notSetUp, with the settings action', () => {
    const caps = capabilities({ providers: [ARENA_NOT_SET_UP], defaultProviderId: 'arena-default' })
    expect(selectEngine({ effective: CLOUD, dataClass: 'schema', capabilities: caps })).toEqual({
      unavailable: ['notSetUp'],
    })
    expect(getAiUnavailableActions({ reasons: ['notSetUp'], canChangePolicy: true })).toEqual(['openSettings'])
  })

  test('an account provider not tested yet is used; one that failed its test is not', () => {
    const untested = capabilities({ providers: [{ ...ACCOUNT, status: 'notTested' }, ARENA] })
    const selection = selectEngine({ effective: CLOUD, dataClass: 'data', capabilities: untested })
    expect('engine' in selection && selection.engine.providerId).toBe('acct:a1')
    const failed = capabilities({ providers: [{ ...ACCOUNT, status: 'notAvailable' }, ARENA] })
    expect(selectEngine({ effective: CLOUD, dataClass: 'data', capabilities: failed })).toEqual({
      unavailable: ['notAvailable'],
    })
  })

  test('every gateway request names its provider', async () => {
    const { resolve, state } = setupResolver(capabilities())
    const byDefault = await resolve({ feature: 'expressionExplain', surveyId: 1 })
    await resolve({ feature: 'expressionExplain', surveyId: 1, providerId: 'arena-default' })
    expect(byDefault.engine).toEqual({
      id: 'gateway',
      hostingClass: 'cloud',
      label: 'My OpenAI',
      labelKey: null,
      model: 'gpt-x',
      limits: { maxPromptChars: 150000, maxSteps: 10 },
      providerId: 'acct:a1',
    })
    expect(state.gatewayCalls).toEqual([
      { feature: 'expressionExplain', dataClass: 'schema', surveyId: 1, providerId: 'acct:a1' },
      { feature: 'expressionExplain', dataClass: 'schema', surveyId: 1, providerId: 'arena-default' },
    ])
  })

  test('a local provider is called with its own probe, after the consent for its URL', async () => {
    const { resolve, state } = setupResolver(capabilities({ defaultProviderId: 'local:l1' }), ['continue'])
    const { engine } = await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(engine).toEqual({
      id: 'localServer',
      hostingClass: 'onDevice',
      label: 'Desk server',
      labelKey: null,
      model: 'local-model',
      limits: { maxPromptChars: 18432, maxSteps: 6 },
      contextWindow: { tokens: 8192, assumed: false },
      providerId: 'local:l1',
    })
    expect(state.requests.map((request) => request.baseUrl)).toEqual([LOCAL_URL])
    expect(state.localServers).toEqual([LOCAL_URL])
    expect(state.gatewayCalls).toEqual([])
  })
})
