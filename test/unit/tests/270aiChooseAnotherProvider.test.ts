import type { AiPolicy } from '@common/ai/policy'
import SystemError from '@core/systemError'
import en from '@core/i18n/resources/en'
import es from '@core/i18n/resources/es'
import fr from '@core/i18n/resources/fr'
import ja from '@core/i18n/resources/ja'
import mn from '@core/i18n/resources/mn'
import pt from '@core/i18n/resources/pt'
import ru from '@core/i18n/resources/ru'

import { createConsentRequestQueue } from '@webapp/ai/engines/consentRequests'
import { getAiEngineErrorView } from '@webapp/ai/engines/engineUi'
import type { AiFeatureSwitches } from '@webapp/ai/engines/featureSwitches'
import { loadLocalServerConsent } from '@webapp/ai/engines/localServerConsent'
import { createModelResolver, type LocalServerConsentAnswer } from '@webapp/ai/engines/resolveModel'
import type { AiCapabilities, AiEngine, StorageLike } from '@webapp/ai/engines/types'
import { isRunStoppingError } from '@webapp/ai/workflows/batchRun'
import { isAiAbortError } from '@webapp/ai/runtime/runtimeErrors'

const LOCAL_URL = 'http://localhost:1234/v1'
const CLOUD: AiPolicy = { schema: 'cloud', data: 'cloud' }
const ON_SETTINGS: AiFeatureSwitches = {
  featuresEnabled: true,
  featureToggles: { expressions: true, chat: true, dataQuery: true, userActivity: true, assistantDesign: true },
  disabledFeatures: [],
}

const CAPABILITIES: AiCapabilities = {
  instance: { policyCeilings: CLOUD, orgHostedBaseUrls: [], maxPromptChars: 200000 },
  providers: [
    {
      id: 'local:l1',
      kind: 'local',
      type: 'local',
      name: 'Local server',
      model: 'local-model',
      baseUrl: LOCAL_URL,
      hostingClass: 'onDevice',
      status: 'ready',
    },
    {
      id: 'arena-default',
      kind: 'arenaDefault',
      type: 'openai',
      name: 'Arena default',
      model: 'admin-model',
      baseUrl: null,
      hostingClass: 'cloud',
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
      contextTokens: 8192,
      baseUrl: LOCAL_URL,
      modelId: 'local-model',
      error: null,
    },
  },
}

/** Builds an in-memory storage. */
const memoryStorage = (): StorageLike => {
  const data = new Map<string, string>()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) }
}

const PROVIDER_ERROR_KEYS = ['aiProviderChooseAnother', 'aiProviderNotFound', 'aiApiKeyUnreadable']
const resources: Record<string, any> = { en, es, fr, ja, mn, pt, ru }

describe('choose another provider (270)', () => {
  test('"Choose another provider" fails the request without trying another provider', async () => {
    const storage = memoryStorage()
    const answers: LocalServerConsentAnswer[] = ['chooseOther']
    const state = { gatewayCalls: 0, localEngines: 0, consentChanges: 0 }
    const resolve = createModelResolver({
      getUserUuid: () => 'u1',
      isInstanceEnabled: () => true,
      getSettings: () => ON_SETTINGS,
      loadCapabilities: async () => CAPABILITIES,
      getEffectivePolicyFor: async () => CLOUD,
      storage,
      requestConsent: async () => answers.shift() ?? 'cancel',
      onConsentChange: () => {
        state.consentChanges += 1
      },
      createGatewayModel: () => {
        state.gatewayCalls += 1
        return {} as any
      },
      createLocalEngine: async () => {
        state.localEngines += 1
        return { createModel: () => ({}) } as unknown as AiEngine
      },
    })
    const error = await resolve({ feature: 'expressionExplain', surveyId: 1 }).catch((e) => e)
    expect(error.key).toBe('aiProviderChooseAnother')
    expect(error.statusCode).toBe(409)
    expect(isAiAbortError(error)).toBe(false)
    expect(state).toEqual({ gatewayCalls: 0, localEngines: 0, consentChanges: 0 })
    expect(loadLocalServerConsent({ storage, userUuid: 'u1', surveyId: 1, baseUrl: LOCAL_URL })).toBeNull()
  })

  test('requests of one survey and server share one card, which has no "other engine" flag', async () => {
    const queue = createConsentRequestQueue()
    const request = { surveyId: 1, baseUrl: LOCAL_URL, modelId: 'local-model', hostingClass: 'onDevice' as const }
    const first = queue.request(request)
    const second = queue.request({ ...request, modelId: 'another-model' })
    expect(queue.getPending()).toEqual({ id: 1, ...request })
    queue.answer(1, 'chooseOther')
    expect(await first).toBe('chooseOther')
    expect(await second).toBe('chooseOther')
    expect(queue.getPending()).toBeNull()
  })

  test('provider errors offer the settings, not a retry', () => {
    for (const key of PROVIDER_ERROR_KEYS) {
      expect([key, getAiEngineErrorView(new SystemError(key, {}))]).toEqual([key, { retry: false, openSettings: true }])
    }
  })

  test('provider errors stop a batch run', () => {
    for (const key of PROVIDER_ERROR_KEYS) {
      expect([key, isRunStoppingError(new SystemError(key, {}, 409))]).toEqual([key, true])
    }
  })

  test.each(Object.keys(resources))('%s has the texts', (lang) => {
    const { appErrors, common } = resources[lang]
    expect(typeof appErrors.aiProviderChooseAnother).toBe('string')
    expect(typeof common.aiEngine.consent.chooseOther).toBe('string')
    expect(common.aiEngine.consent.useOther).toBeUndefined()
  })
})
