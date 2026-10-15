import { createConsentRequestQueue } from '@webapp/ai/engines/consentRequests'
import type { AiPolicy } from '@common/ai/policy'
import type { AiFeatureSwitches } from '@webapp/ai/engines/featureSwitches'
import { loadLocalServerConsent, saveLocalServerConsent } from '@webapp/ai/engines/localServerConsent'
import {
  createModelResolver,
  type LocalServerConsentAnswer,
  type LocalServerConsentRequest,
  type ModelResolverDeps,
} from '@webapp/ai/engines/resolveModel'
import type { AiCapabilities, AiEngine, StorageLike } from '@webapp/ai/engines/types'

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

const CAPABILITIES: AiCapabilities = {
  instance: { policyCeilings: { schema: 'cloud', data: 'cloud' }, orgHostedBaseUrls: [], maxPromptChars: 1000 },
  providers: [
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
  defaultProviderId: 'local:l1',
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
}

const POLICY: AiPolicy = { schema: 'onDevice', data: 'onDevice' }

const setup = (answers: LocalServerConsentAnswer[] = []) => {
  const storage = memoryStorage()
  const requests: LocalServerConsentRequest[] = []
  const resolve = createModelResolver({
    getUserUuid: () => 'u1',
    isInstanceEnabled: () => true,
    getSettings: () => SETTINGS,
    loadCapabilities: async () => CAPABILITIES,
    getEffectivePolicyFor: async () => POLICY,
    storage,
    requestConsent: async (request) => {
      requests.push(request)
      return answers.shift() ?? 'cancel'
    },
    onConsentChange: () => undefined,
    createGatewayModel: () => ({ id: 'gateway' }) as any,
    createLocalEngine: async () => ({ createModel: () => ({ id: 'local' }) }) as unknown as AiEngine,
  } as ModelResolverDeps)
  return { resolve, requests, storage }
}

const load = (storage: StorageLike, dataClass: 'schema' | 'data') =>
  loadLocalServerConsent({ storage, userUuid: 'u1', surveyId: 1, baseUrl: URL_A, dataClass })

describe('resolveModel: local consent per data class (372)', () => {
  test('the consent request names the data class of the request', async () => {
    const { resolve, requests } = setup(['continue'])
    await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(requests.map((request) => request.dataClass)).toEqual(['schema'])
    const other = setup(['continue'])
    await other.resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(other.requests.map((request) => request.dataClass)).toEqual(['data'])
  })

  test('a consent for the survey design does not skip the dialog for record data', async () => {
    const { resolve, requests, storage } = setup(['continue', 'continue'])
    await resolve({ feature: 'expressionExplain', surveyId: 1 })
    // the survey design needs no new answer
    await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(requests).toHaveLength(1)
    // record data does
    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(requests.map((request) => request.dataClass)).toEqual(['schema', 'data'])
    expect(load(storage, 'data')).toBe('accepted')
  })

  test('a consent for record data covers the survey design: no second dialog', async () => {
    const { resolve, requests } = setup(['continue'])
    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    await resolve({ feature: 'expressionExplain', surveyId: 1 })
    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(requests).toHaveLength(1)
  })

  test('an answer other than Continue stores nothing for the class', async () => {
    const { resolve, storage } = setup(['chooseOther'])
    const error = await resolve({ feature: 'activityLogSummary', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiProviderChooseAnother')
    expect(load(storage, 'schema')).toBeNull()
    expect(load(storage, 'data')).toBeNull()
  })

  test('a consent stored before the data class existed asks again for record data only', async () => {
    const { resolve, requests, storage } = setup(['continue'])
    storage.setItem('arena.ai.localServerConsent.u1', JSON.stringify({ '1': { decision: 'accepted', baseUrl: URL_A } }))
    await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(requests).toHaveLength(0)
    await resolve({ feature: 'activityLogSummary', surveyId: 1 })
    expect(requests.map((request) => request.dataClass)).toEqual(['data'])
  })

  test('a decline stored by the older dialog counts as not asked', async () => {
    const { resolve, requests, storage } = setup(['continue', 'continue'])
    await resolve({ feature: 'expressionExplain', surveyId: 1 })
    saveLocalServerConsent({ storage, userUuid: 'u1', surveyId: 1, baseUrl: URL_A, decision: 'declined' })
    await resolve({ feature: 'expressionExplain', surveyId: 1 })
    expect(requests).toHaveLength(2)
  })
})

describe('consent request queue: data class (372)', () => {
  const request = (dataClass: 'schema' | 'data') => ({
    surveyId: 1,
    baseUrl: URL_A,
    modelId: 'local-model',
    hostingClass: 'onDevice' as const,
    dataClass,
  })

  test('the same survey, server and class share one dialog', async () => {
    const queue = createConsentRequestQueue()
    const first = queue.request(request('data'))
    const second = queue.request(request('data'))
    queue.answer(queue.getPending()!.id, 'continue')
    expect(await first).toBe('continue')
    expect(await second).toBe('continue')
    expect(queue.getPending()).toBeNull()
  })

  test('another data class is another dialog, shown after the first', async () => {
    const queue = createConsentRequestQueue()
    const design = queue.request(request('schema'))
    const data = queue.request(request('data'))
    expect(queue.getPending()?.dataClass).toBe('schema')
    queue.answer(queue.getPending()!.id, 'continue')
    await design
    expect(queue.getPending()?.dataClass).toBe('data')
    queue.answer(queue.getPending()!.id, 'cancel')
    expect(await data).toBe('cancel')
  })
})
