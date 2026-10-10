import { AiProvider } from '@common/ai/aiProvider'

import type { LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import type { AiLocalServerSettings } from '@webapp/ai/engines/types'
import {
  type AiEngineCandidate,
  getAiEngineStatus,
  getAiEngineStatusText,
  getCloudEngineCandidate,
  getLocalEngineCandidate,
} from '@webapp/components/ai/UserAiSettingsPanel/aiEngineStatus'
import {
  type AiSettings,
  buildCloudTestKey,
  buildTestDraft,
  canListModels,
  chooseListedModel,
  createEmptyForm,
  DEFAULT_PROVIDER_VALUE,
  type FormState,
  getApiErrorMessage,
  getCloudTestMessage,
  getCurrentCloudTestResult,
  getProviderSpec,
  hasCloudApiKey,
  isCloudDraftSaved,
  settingsToForm,
  shouldShowLocalUrlHint,
} from '@webapp/components/ai/UserAiSettingsPanel/aiSettingsForm'

const ORG_URL = 'http://10.0.0.5:8000/v1'
const allowlist = [ORG_URL]
const compatible = getProviderSpec(AiProvider.openaiCompatible)
const vercel = getProviderSpec(AiProvider.vercelAiSdk)
const openai = getProviderSpec(AiProvider.openai)
const arenaDefault = getProviderSpec(DEFAULT_PROVIDER_VALUE)

// returns the key, followed by the params when there are some
const t = (key: string, params?: Record<string, unknown>): string => (params ? `${key} ${JSON.stringify(params)}` : key)

const form = (overrides: Partial<FormState> = {}): FormState => ({
  ...createEmptyForm(),
  featuresEnabled: true,
  provider: AiProvider.openaiCompatible,
  baseUrl: 'https://models.example.org/v1',
  model: 'remote-model',
  ...overrides,
})

const savedSettings: AiSettings = {
  enabled: true,
  provider: AiProvider.openaiCompatible,
  baseUrl: 'https://models.example.org/v1',
  model: 'remote-model',
  hasApiKey: false,
  lastTestOk: null,
}

const testView = (overrides: Partial<LocalServerTestView> = {}): LocalServerTestView => ({
  reachable: true,
  models: ['model-a'],
  hostingClass: 'onDevice',
  contextTokens: 4096,
  error: null,
  showHttpsHint: false,
  showCloudWarning: false,
  ...overrides,
})

const localDraft: AiLocalServerSettings = {
  enabled: true,
  baseUrl: 'http://localhost:1234/v1',
  modelId: 'model-a',
  preferLocal: true,
}

const cloudParams = {
  spec: compatible,
  draft: {
    provider: AiProvider.openaiCompatible,
    model: 'remote-model',
    baseUrl: 'https://models.example.org/v1',
    hasApiKey: false,
  },
  adminDefault: null,
  allowlist,
  saved: { matches: true, lastTestOk: null },
  testOk: null,
}

describe('local URL in the cloud Base URL', () => {
  test('the hint shows for local and private addresses, with or without scheme', () => {
    expect(shouldShowLocalUrlHint({ spec: compatible, baseUrl: 'localhost:1234/v1', allowlist })).toBe(true)
    expect(shouldShowLocalUrlHint({ spec: compatible, baseUrl: 'http://192.168.1.20:1234/v1', allowlist })).toBe(true)
    expect(shouldShowLocalUrlHint({ spec: vercel, baseUrl: 'http://127.0.0.1:3000/api/chat', allowlist })).toBe(true)
  })

  test('no hint for public, allowlisted or base-URL-less providers', () => {
    expect(shouldShowLocalUrlHint({ spec: compatible, baseUrl: 'https://models.example.org/v1', allowlist })).toBe(
      false
    )
    expect(shouldShowLocalUrlHint({ spec: compatible, baseUrl: ORG_URL, allowlist })).toBe(false)
    expect(shouldShowLocalUrlHint({ spec: openai, baseUrl: 'localhost:1234/v1', allowlist })).toBe(false)
    expect(shouldShowLocalUrlHint({ spec: compatible, baseUrl: '', allowlist })).toBe(false)
  })

  test('the models are not listed for a local URL: the server would refuse it', () => {
    const params = { spec: compatible, settings: savedSettings, allowlist }
    expect(canListModels({ ...params, form: form({ baseUrl: 'localhost:1234/v1' }) })).toBe(false)
    expect(canListModels({ ...params, form: form() })).toBe(true)
    expect(canListModels({ ...params, form: form({ baseUrl: '  ' }) })).toBe(false)
    expect(canListModels({ ...params, spec: vercel, form: form({ provider: AiProvider.vercelAiSdk }) })).toBe(false)
  })

  test('a provider that needs a key lists the models with a typed or a stored key', () => {
    const openaiForm = form({ provider: AiProvider.openai, baseUrl: '' })
    expect(canListModels({ spec: openai, form: openaiForm, settings: savedSettings, allowlist })).toBe(false)
    const typed = { ...openaiForm, apiKey: 'sk-1', apiKeyDirty: true, apiKeyVersion: 1 }
    expect(canListModels({ spec: openai, form: typed, settings: savedSettings, allowlist })).toBe(true)
    const stored = { ...savedSettings, hasApiKey: true }
    expect(canListModels({ spec: openai, form: openaiForm, settings: stored, allowlist })).toBe(true)
    expect(hasCloudApiKey({ form: { ...typed, apiKey: ' ' }, settings: stored })).toBe(false)
  })
})

describe('cloud Test result', () => {
  const result = { ok: true, latencyMs: 120 }

  test('it applies to the exact draft it tested, also after a Save', () => {
    const tested = form({ apiKey: 'sk-1', apiKeyDirty: true, apiKeyVersion: 3 })
    const test = { key: buildCloudTestKey(tested), result }
    expect(getCurrentCloudTestResult({ test, form: tested })).toBe(result)
    // Save clears the typed key but keeps its edit counter
    const afterSave = { ...tested, apiKey: '', apiKeyDirty: false }
    expect(getCurrentCloudTestResult({ test, form: afterSave })).toBe(result)
    expect(getCurrentCloudTestResult({ test, form: { ...tested, baseUrl: `${tested.baseUrl} ` } })).toBe(result)
  })

  test('any edit drops it', () => {
    const tested = form()
    const test = { key: buildCloudTestKey(tested), result }
    expect(getCurrentCloudTestResult({ test, form: { ...tested, model: 'other' } })).toBeNull()
    expect(getCurrentCloudTestResult({ test, form: { ...tested, baseUrl: 'https://other.example.org/v1' } })).toBeNull()
    expect(getCurrentCloudTestResult({ test, form: { ...tested, provider: AiProvider.openai } })).toBeNull()
    expect(getCurrentCloudTestResult({ test, form: { ...tested, apiKeyVersion: 1 } })).toBeNull()
    expect(getCurrentCloudTestResult({ test: null, form: tested })).toBeNull()
  })

  test('messages', () => {
    const params = { spec: compatible, allowlist, t }
    expect(getCloudTestMessage({ ...params, result, baseUrl: 'https://models.example.org/v1' })).toBe(
      'userAiSettings:cloud.testOk {"latencyMs":120}'
    )
    const refused = { ok: false, errorKey: 'aiBaseUrlNotAllowed', errorParams: { baseUrl: 'x' } }
    expect(getCloudTestMessage({ ...params, result: refused, baseUrl: 'localhost:1234/v1' })).toBe(
      'userAiSettings:cloud.localUrlHint'
    )
    const prefixed = { ...refused, errorKey: 'appErrors:aiBaseUrlNotAllowed' }
    expect(getCloudTestMessage({ ...params, result: prefixed, baseUrl: 'https://models.example.org/v1' })).toContain(
      'appErrors:aiBaseUrlNotAllowed'
    )
    expect(getCloudTestMessage({ ...params, result: { ok: false, errorMessage: 'boom' }, baseUrl: '' })).toBe('boom')
    expect(getCloudTestMessage({ ...params, result: { ok: false }, baseUrl: '' })).toBe(
      'appErrors:aiProviderUnavailable'
    )
  })

  test('API errors use the appErrors key when there is one', () => {
    const keyed = { response: { data: { key: 'appErrors:aiProviderUnavailable', params: { status: 502 } } } }
    expect(getApiErrorMessage({ error: keyed, t })).toContain('appErrors:aiProviderUnavailable')
    expect(getApiErrorMessage({ error: { message: 'Network Error' }, t })).toBe('Network Error')
    expect(getApiErrorMessage({ error: null, t })).toBe('unknown')
  })
})

describe('form helpers', () => {
  test('the settings fill the form; a stored legacy switch is dropped', () => {
    const loaded = settingsToForm({
      ...savedSettings,
      featuresEnabled: true,
      featureToggles: { chat: true, assistant: true } as any,
    })
    expect(loaded).toMatchObject({ provider: AiProvider.openaiCompatible, model: 'remote-model', apiKeyVersion: 0 })
    expect(loaded.featureToggles.chat).toBe(true)
    expect(loaded.featureToggles).not.toHaveProperty('assistant')
    expect(settingsToForm({ ...savedSettings, enabled: false }).provider).toBe(DEFAULT_PROVIDER_VALUE)
  })

  test('a listed model is kept, a stale one replaced by the first listed', () => {
    const models = [{ id: 'm1' }, { id: 'm2' }]
    expect(chooseListedModel({ model: 'm2', models })).toBe('m2')
    expect(chooseListedModel({ model: 'gone', models })).toBe('m1')
    expect(chooseListedModel({ model: 'typed', models: [] })).toBe('typed')
  })

  test('the Test draft sends only what the provider uses', () => {
    expect(buildTestDraft({ form: form(), spec: compatible })).toEqual({
      provider: AiProvider.openaiCompatible,
      model: 'remote-model',
      baseUrl: 'https://models.example.org/v1',
      apiKey: undefined,
    })
    const typed = form({ provider: AiProvider.openai, apiKey: 'sk-1', apiKeyDirty: true })
    expect(buildTestDraft({ form: typed, spec: openai })).toMatchObject({ baseUrl: undefined, apiKey: 'sk-1' })
  })

  test('the draft matches the saved provider until an edit', () => {
    expect(isCloudDraftSaved({ form: form(), settings: savedSettings })).toBe(true)
    expect(isCloudDraftSaved({ form: form({ model: 'other' }), settings: savedSettings })).toBe(false)
    expect(isCloudDraftSaved({ form: form({ apiKeyDirty: true }), settings: savedSettings })).toBe(false)
    const asDefault = form({ provider: DEFAULT_PROVIDER_VALUE, baseUrl: '', model: '' })
    expect(isCloudDraftSaved({ form: asDefault, settings: { ...savedSettings, enabled: false } })).toBe(true)
    expect(isCloudDraftSaved({ form: form(), settings: null })).toBe(false)
  })
})

describe('status line', () => {
  test('local server candidate', () => {
    expect(
      getLocalEngineCandidate({ draft: { ...localDraft, enabled: false }, testView: testView(), allowlist })
    ).toBeNull()
    const ready = getLocalEngineCandidate({ draft: localDraft, testView: testView(), allowlist })
    expect(ready).toEqual({
      id: 'localServer',
      location: { hostingClass: 'onDevice', provider: null, model: 'model-a', engine: 'LM Studio' },
      pill: 'ready',
    })
    expect(getLocalEngineCandidate({ draft: localDraft, testView: null, allowlist })?.pill).toBe('notTested')
    const unreachable = testView({ reachable: false, models: [] })
    expect(getLocalEngineCandidate({ draft: localDraft, testView: unreachable, allowlist })?.pill).toBe('notAvailable')
    const otherModel = { ...localDraft, modelId: 'gone' }
    expect(getLocalEngineCandidate({ draft: otherModel, testView: testView(), allowlist })?.pill).toBe('notAvailable')
    const orgDraft = { ...localDraft, baseUrl: ORG_URL }
    expect(getLocalEngineCandidate({ draft: orgDraft, testView: null, allowlist })?.location.hostingClass).toBe(
      'orgHosted'
    )
  })

  test('Arena default candidate', () => {
    const adminDefault = { provider: AiProvider.openai, model: 'gpt-4o-mini', hostingClass: 'cloud' as const }
    const candidate = getCloudEngineCandidate({ ...cloudParams, spec: arenaDefault, adminDefault })
    expect(candidate).toEqual({
      id: 'cloud',
      location: { hostingClass: 'cloud', provider: AiProvider.openai, model: 'gpt-4o-mini', engine: null },
      pill: 'ready',
    })
    expect(getCloudEngineCandidate({ ...cloudParams, spec: arenaDefault })).toBeNull()
  })

  test('personal provider candidate', () => {
    expect(getCloudEngineCandidate(cloudParams)?.pill).toBe('ready')
    expect(getCloudEngineCandidate({ ...cloudParams, draft: { ...cloudParams.draft, model: '' } })).toBeNull()
    const local = { ...cloudParams.draft, baseUrl: 'localhost:1234/v1' }
    expect(getCloudEngineCandidate({ ...cloudParams, draft: local, testOk: true })?.pill).toBe('notAvailable')
    expect(getCloudEngineCandidate({ ...cloudParams, testOk: false })?.pill).toBe('notAvailable')
    const edited = { ...cloudParams, saved: { matches: false, lastTestOk: null } }
    expect(getCloudEngineCandidate(edited)?.pill).toBe('notTested')
    expect(getCloudEngineCandidate({ ...edited, testOk: true })?.pill).toBe('ready')
    expect(getCloudEngineCandidate({ ...cloudParams, saved: { matches: true, lastTestOk: false } })?.pill).toBe(
      'notAvailable'
    )
    const org = { ...cloudParams.draft, baseUrl: ORG_URL }
    expect(getCloudEngineCandidate({ ...cloudParams, draft: org })?.location.hostingClass).toBe('orgHosted')
  })

  test('the Order picks the first engine that is not "Not available"', () => {
    const local: AiEngineCandidate = getLocalEngineCandidate({ draft: localDraft, testView: testView(), allowlist })!
    const cloud: AiEngineCandidate = getCloudEngineCandidate(cloudParams)!
    expect(getAiEngineStatus({ preferLocal: true, local, cloud }).engine).toBe(local)
    expect(getAiEngineStatus({ preferLocal: false, local, cloud }).engine).toBe(cloud)
    const down = { ...local, pill: 'notAvailable' as const }
    expect(getAiEngineStatus({ preferLocal: true, local: down, cloud })).toEqual({ engine: cloud, pill: 'ready' })
    expect(getAiEngineStatus({ preferLocal: true, local: down, cloud: null })).toEqual({
      engine: down,
      pill: 'notAvailable',
    })
    expect(getAiEngineStatus({ preferLocal: true, local: null, cloud: null })).toEqual({
      engine: null,
      pill: 'notAvailable',
    })
  })

  test('text: the data location and the model, or what to do', () => {
    const local = getLocalEngineCandidate({ draft: localDraft, testView: testView(), allowlist })!
    expect(getAiEngineStatusText({ status: { engine: local, pill: 'ready' }, t })).toBe(
      'aiDataLocation.onDeviceWithEngine {"engine":"LM Studio"} · model-a'
    )
    expect(getAiEngineStatusText({ status: { engine: null, pill: 'notAvailable' }, t })).toBe(
      'userAiSettings:status.none'
    )
  })
})
