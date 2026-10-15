import type { AiPublicProvider } from '@webapp/ai/engines/providerEntries'
import type { LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import type { AiLocalServerCapability, AiProviderEntry } from '@webapp/ai/engines/types'
import { getProviderMonogram } from '@webapp/components/ai/ProviderMonogram/providerMonogram'
import { isApiKeyCleared, isApiKeyMissing } from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerKey'
import {
  canListModels,
  resolveFetchedModel,
} from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerModels'
import {
  buildAccountRequest,
  buildLocalProviderSave,
  canSaveDraft,
  shouldBecomeDefault,
} from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerSave'
import {
  buildTestKey,
  type DraftTest,
  getAccountTestMessage,
  getInitialLocalTest,
  isTestPassed,
} from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerTest'
import {
  getProviderTypeGroups,
  getProviderTypeSpec,
  type ProviderTypeGroup,
  type ProviderTypeSpec,
  type SavedProvider,
  toSavedProvider,
} from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerTypes'
import { createDraft, type ProviderDraft } from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerDraft'

const allowlist = ['http://gpu.org.example:8000/v1']
const openai = getProviderTypeSpec('openai')
const compatible = getProviderTypeSpec('openai-compatible')
const local = getProviderTypeSpec('local')
const org = getProviderTypeSpec('orgServer')
const vercel = getProviderTypeSpec('vercel-ai-sdk')

const savedCompatible: SavedProvider = {
  id: 'acct:c1',
  kind: 'account',
  dialogType: 'openai-compatible',
  name: 'OpenRouter',
  model: 'm1',
  baseUrl: 'https://openrouter.ai/api/v1',
  hasApiKey: true,
  apiKeyReadable: true,
}

const savedOpenai: SavedProvider = {
  id: 'acct:o2',
  kind: 'account',
  dialogType: 'openai',
  name: 'OpenAI',
  model: 'gpt-x',
  baseUrl: null,
  hasApiKey: true,
  apiKeyReadable: true,
}

const savedLocal: SavedProvider = {
  id: 'local:a',
  kind: 'local',
  dialogType: 'local',
  name: 'A',
  model: 'x',
  baseUrl: 'http://localhost:1/v1',
  hasApiKey: false,
  apiKeyReadable: false,
}

/** Returns the draft of a type with changes on top. */
const draftOf = (spec: ProviderTypeSpec, saved: SavedProvider | null, patch: Partial<ProviderDraft> = {}) => ({
  ...createDraft({ type: spec.value, saved }),
  ...patch,
})

/** Returns a passing test of the draft. */
const passed = (spec: ProviderTypeSpec, draft: ProviderDraft): DraftTest => ({
  key: buildTestKey({ spec, draft }),
  account: { ok: true, latencyMs: 12 },
  local: null,
})

/** Returns a Local server result that answered with the models. */
const answered = (models: string[]): LocalServerTestView => ({
  reachable: true,
  models,
  hostingClass: 'onDevice',
  contextTokens: 4096,
  error: null,
  showHttpsHint: false,
  showCloudWarning: false,
})

/** Returns the group keys with their option values. */
const groupValues = (groups: ProviderTypeGroup[]) =>
  groups.map((group) => [group.key, group.options.map((option) => option.spec.value)])

describe('provider dialog types (267)', () => {
  test('type groups: Organisation server only with an allowlist, the mock only on test servers', () => {
    expect(
      groupValues(getProviderTypeGroups({ allowlist: [], encryptionConfigured: true, mockEnabled: false }))
    ).toEqual([
      ['local', ['local']],
      ['cloud', ['openai', 'anthropic', 'google', 'openai-compatible', 'vercel-ai-sdk']],
    ])
    expect(groupValues(getProviderTypeGroups({ allowlist, encryptionConfigured: true, mockEnabled: true }))).toEqual([
      ['local', ['local', 'orgServer']],
      ['cloud', ['openai', 'anthropic', 'google', 'openai-compatible', 'vercel-ai-sdk', 'mock']],
    ])
  })

  test('without the encryption secret only the types that need a key are disabled', () => {
    const groups = getProviderTypeGroups({ allowlist, encryptionConfigured: false, mockEnabled: false })
    const disabled = groups
      .flatMap((group) => group.options)
      .filter((option) => option.disabled)
      .map((option) => option.spec.value)
    expect(disabled).toEqual(['openai', 'anthropic', 'google'])
  })

  test('a saved provider opens with its dialog type; an allowlisted openai-compatible one is an Organisation server', () => {
    const entry: AiProviderEntry = {
      id: 'acct:o1',
      kind: 'account',
      type: 'openai-compatible',
      name: 'GPU',
      model: 'llama',
      baseUrl: 'http://gpu.org.example:8000/v1',
      hostingClass: 'orgHosted',
      status: 'ready',
    }
    const accountProviders: AiPublicProvider[] = [
      {
        id: 'acct:o1',
        type: 'openai-compatible',
        name: 'GPU',
        model: 'llama',
        baseUrl: 'http://gpu.org.example:8000/v1',
        hostingClass: 'orgHosted',
        hasApiKey: false,
        apiKeyReadable: false,
        lastTestOk: true,
        lastTestAt: null,
      },
    ]
    expect(toSavedProvider({ entry, accountProviders, allowlist })).toEqual({
      id: 'acct:o1',
      kind: 'account',
      dialogType: 'orgServer',
      name: 'GPU',
      model: 'llama',
      baseUrl: 'http://gpu.org.example:8000/v1',
      hasApiKey: false,
      apiKeyReadable: false,
    })
    expect(toSavedProvider({ entry, accountProviders, allowlist: [] })?.dialogType).toBe('openai-compatible')
    expect(
      toSavedProvider({
        entry: { ...entry, id: 'local:l1', kind: 'local', type: 'local' },
        accountProviders,
        allowlist,
      })
    ).toMatchObject({ kind: 'local', dialogType: 'local', hasApiKey: false })
    expect(
      toSavedProvider({
        entry: { ...entry, id: 'arena-default', kind: 'arenaDefault', type: 'openai' },
        accountProviders,
        allowlist,
      })
    ).toBeNull()

    expect(getProviderMonogram('local')).toEqual({ text: 'LS', tone: 'local' })
    expect(getProviderMonogram('anthropic')).toEqual({ text: 'An', tone: 'anthropic' })
    expect(getProviderMonogram('arena-default')).toEqual({ text: 'Ar', tone: 'default' })
    expect(getProviderMonogram('something')).toEqual({ text: 'AI', tone: 'other' })
  })
})

describe('provider dialog draft (267)', () => {
  test('account request: the id only when editing, the key only when typed, the base URL only where the type needs it', () => {
    const added = draftOf(openai, null, { model: 'gpt-x', apiKey: ' sk-new ', baseUrl: 'ignored' })
    expect(buildAccountRequest({ spec: openai, draft: added, saved: null })).toEqual({
      type: 'openai',
      name: 'OpenAI',
      model: 'gpt-x',
      baseUrl: null,
      apiKey: 'sk-new',
    })
    const edited = draftOf(compatible, savedCompatible, { name: '  My   router ' })
    expect(buildAccountRequest({ spec: compatible, draft: edited, saved: savedCompatible })).toEqual({
      id: 'acct:c1',
      type: 'openai-compatible',
      name: 'My router',
      model: 'm1',
      baseUrl: 'https://openrouter.ai/api/v1',
    })
    expect(
      buildAccountRequest({
        spec: vercel,
        draft: draftOf(vercel, null, { baseUrl: 'https://x.example/api/chat' }),
        saved: null,
      })
    ).toEqual({ type: 'vercel-ai-sdk', name: 'Vercel AI SDK', model: null, baseUrl: 'https://x.example/api/chat' })
    expect(
      buildAccountRequest({
        spec: org,
        draft: draftOf(org, null, { baseUrl: allowlist[0], model: 'llama' }),
        saved: null,
      })
    ).toMatchObject({ type: 'openai-compatible', name: 'Organisation server', baseUrl: allowlist[0] })
  })

  test('a changed base URL clears the key and needs a new test', () => {
    const before = draftOf(compatible, savedCompatible)
    const oldTest = passed(compatible, before)
    expect(isApiKeyCleared({ spec: compatible, draft: before, saved: savedCompatible })).toBe(false)
    expect(isApiKeyMissing({ spec: compatible, draft: before, saved: savedCompatible })).toBe(false)
    // a trailing slash is not a change
    const slash = { ...before, baseUrl: 'https://openrouter.ai/api/v1/' }
    expect(isApiKeyCleared({ spec: compatible, draft: slash, saved: savedCompatible })).toBe(false)

    const moved = { ...before, baseUrl: 'https://other.example/v1' }
    expect(isApiKeyCleared({ spec: compatible, draft: moved, saved: savedCompatible })).toBe(true)
    expect(isApiKeyMissing({ spec: compatible, draft: moved, saved: savedCompatible })).toBe(true)
    expect(canListModels({ spec: compatible, draft: moved, saved: savedCompatible, allowlist })).toBe(false)
    expect(canSaveDraft({ spec: compatible, draft: moved, saved: savedCompatible, test: oldTest })).toBe(false)
    // the request never carries the saved key: without a typed key there is none
    expect(buildAccountRequest({ spec: compatible, draft: moved, saved: savedCompatible })).not.toHaveProperty('apiKey')

    const withKey = { ...moved, apiKey: 'sk-other', apiKeyVersion: 1 }
    expect(isApiKeyMissing({ spec: compatible, draft: withKey, saved: savedCompatible })).toBe(false)
    expect(canSaveDraft({ spec: compatible, draft: withKey, saved: savedCompatible, test: oldTest })).toBe(false)
    expect(
      canSaveDraft({ spec: compatible, draft: withKey, saved: savedCompatible, test: passed(compatible, withKey) })
    ).toBe(true)
    expect(buildAccountRequest({ spec: compatible, draft: withKey, saved: savedCompatible })).toMatchObject({
      id: 'acct:c1',
      baseUrl: 'https://other.example/v1',
      apiKey: 'sk-other',
    })
  })

  test('an unreadable saved key must be typed again; a cloud type without any key cannot be tested', () => {
    const unreadable = { ...savedOpenai, apiKeyReadable: false }
    expect(isApiKeyMissing({ spec: openai, draft: draftOf(openai, savedOpenai), saved: savedOpenai })).toBe(false)
    expect(isApiKeyMissing({ spec: openai, draft: draftOf(openai, unreadable), saved: unreadable })).toBe(true)
    expect(
      isApiKeyMissing({ spec: openai, draft: draftOf(openai, unreadable, { apiKey: 'sk' }), saved: unreadable })
    ).toBe(false)
    expect(isApiKeyMissing({ spec: openai, draft: draftOf(openai, null), saved: null })).toBe(true)
    // an OpenAI-compatible server may run without a key
    const keyless = draftOf(compatible, null, { baseUrl: 'https://x.example/v1' })
    expect(isApiKeyMissing({ spec: compatible, draft: keyless, saved: null })).toBe(false)
  })

  test('a change after a passing test needs a new test', () => {
    const draft = draftOf(openai, null, { model: 'gpt-x', apiKey: 'sk-1', apiKeyVersion: 1 })
    const test = passed(openai, draft)
    expect(isTestPassed({ test, spec: openai, draft })).toBe(true)
    expect(canSaveDraft({ spec: openai, draft, saved: null, test })).toBe(true)
    for (const changed of [
      { ...draft, model: 'gpt-y' },
      { ...draft, apiKey: 'sk-2', apiKeyVersion: 2 },
    ]) {
      expect(canSaveDraft({ spec: openai, draft: changed, saved: null, test })).toBe(false)
    }
    const url = draftOf(compatible, null, { baseUrl: 'https://a.example/v1', model: 'm' })
    const otherUrl = { ...url, baseUrl: 'https://b.example/v1' }
    expect(canSaveDraft({ spec: compatible, draft: otherUrl, saved: null, test: passed(compatible, url) })).toBe(false)
    // a failed test never enables saving
    const failed: DraftTest = { ...test, account: { ok: false, latencyMs: 3, errorKey: 'aiProviderAuth' } }
    expect(canSaveDraft({ spec: openai, draft, saved: null, test: failed })).toBe(false)
    // the same values under another type are another draft
    expect(isTestPassed({ test, spec: compatible, draft: { ...draft, type: 'openai-compatible' } })).toBe(false)
  })

  test('editing only the name saves without a test; editing nothing saves nothing', () => {
    const same = draftOf(compatible, savedCompatible)
    expect(canSaveDraft({ spec: compatible, draft: same, saved: savedCompatible, test: null })).toBe(false)
    expect(
      canSaveDraft({ spec: compatible, draft: { ...same, name: 'Router 2' }, saved: savedCompatible, test: null })
    ).toBe(true)
    const renamedAndMoved = { ...same, name: 'Router 2', model: 'm2' }
    expect(canSaveDraft({ spec: compatible, draft: renamedAndMoved, saved: savedCompatible, test: null })).toBe(false)
    const unreadable = { ...savedOpenai, apiKeyReadable: false }
    const renamed = draftOf(openai, unreadable, { name: 'Renamed' })
    expect(canSaveDraft({ spec: openai, draft: renamed, saved: unreadable, test: null })).toBe(true)
  })

  test('model list: needs the key, an address the server can reach, and an allowlisted one for an Organisation server', () => {
    expect(canListModels({ spec: openai, draft: draftOf(openai, null), saved: null, allowlist })).toBe(false)
    expect(
      canListModels({ spec: openai, draft: draftOf(openai, null, { apiKey: 'sk' }), saved: null, allowlist })
    ).toBe(true)
    const localUrl = draftOf(compatible, null, { baseUrl: 'http://localhost:11434/v1' })
    expect(canListModels({ spec: compatible, draft: localUrl, saved: null, allowlist })).toBe(false)
    const orgUrl = draftOf(compatible, null, { baseUrl: allowlist[0] })
    expect(canListModels({ spec: compatible, draft: orgUrl, saved: null, allowlist })).toBe(true)
    const cloudOrg = draftOf(org, null, { baseUrl: 'https://cloud.example/v1' })
    expect(canListModels({ spec: org, draft: cloudOrg, saved: null, allowlist })).toBe(false)
    expect(
      canListModels({ spec: org, draft: draftOf(org, null, { baseUrl: allowlist[0] }), saved: null, allowlist })
    ).toBe(true)
    const chat = draftOf(vercel, null, { baseUrl: 'https://x.example/api/chat' })
    expect(canListModels({ spec: vercel, draft: chat, saved: null, allowlist })).toBe(false)
  })

  test('a typed or saved model that is not listed is kept; only an empty one takes the first listed', () => {
    const models = [{ id: 'a' }, { id: 'b' }]
    const typed = draftOf(compatible, null, { model: 'my/deployment', modelFreeText: true })
    expect(resolveFetchedModel({ draft: typed, models })).toEqual({ model: 'my/deployment', modelFreeText: true })
    expect(resolveFetchedModel({ draft: draftOf(compatible, null), models })).toEqual({
      model: 'a',
      modelFreeText: false,
    })
    expect(resolveFetchedModel({ draft: draftOf(compatible, null, { model: 'b' }), models })).toEqual({
      model: 'b',
      modelFreeText: false,
    })
    // editing a provider whose saved model is unlisted: kept as typed text, and a rename still saves without a test
    const unlisted = { ...savedCompatible, model: 'private-model' }
    const edit = draftOf(compatible, unlisted)
    const fetched = resolveFetchedModel({ draft: edit, models })
    expect(fetched).toEqual({ model: 'private-model', modelFreeText: true })
    const renamed = { ...edit, ...fetched, name: 'Renamed' }
    expect(canSaveDraft({ spec: compatible, draft: renamed, saved: unlisted, test: null })).toBe(true)
    expect(buildAccountRequest({ spec: compatible, draft: renamed, saved: unlisted })).toMatchObject({
      model: 'private-model',
    })
  })

  test('local test: passes when the server answered and the chosen model is listed', () => {
    const draft = draftOf(local, null, { model: 'm1' })
    expect(draft.baseUrl).toBe('http://localhost:1234/v1')
    const test: DraftTest = { key: buildTestKey({ spec: local, draft }), account: null, local: answered(['m1', 'm2']) }
    expect(isTestPassed({ test, spec: local, draft })).toBe(true)
    // another listed model needs no new test, an unlisted one or another server does
    expect(isTestPassed({ test, spec: local, draft: { ...draft, model: 'm2' } })).toBe(true)
    expect(isTestPassed({ test, spec: local, draft: { ...draft, model: 'other' } })).toBe(false)
    expect(isTestPassed({ test, spec: local, draft: { ...draft, baseUrl: 'http://localhost:1235/v1' } })).toBe(false)
    // typed without a scheme or with a trailing slash: the same server
    expect(isTestPassed({ test, spec: local, draft: { ...draft, baseUrl: 'localhost:1234/v1/' } })).toBe(true)
    const unreachable: DraftTest = { ...test, local: { ...answered(['m1']), reachable: false } }
    expect(isTestPassed({ test: unreachable, spec: local, draft })).toBe(false)
  })

  test('local save: a new provider is added last, an edited one keeps its place; the default only replaces a missing Arena default', () => {
    const existing = [
      { id: 'local:a', name: 'A', baseUrl: 'http://localhost:1/v1', modelId: 'x' },
      { id: 'local:b', name: 'B', baseUrl: 'http://localhost:2/v1', modelId: 'y' },
    ]
    const added = buildLocalProviderSave({
      providers: existing,
      saved: null,
      draft: draftOf(local, null, { model: 'm1' }),
      newId: 'local:new',
    })
    expect(added?.provider).toEqual({
      id: 'local:new',
      name: 'Local server',
      baseUrl: 'http://localhost:1234/v1',
      modelId: 'm1',
    })
    expect(added?.providers.map((provider) => provider.id)).toEqual(['local:a', 'local:b', 'local:new'])

    const edited = buildLocalProviderSave({
      providers: existing,
      saved: savedLocal,
      draft: draftOf(local, savedLocal, { name: 'Laptop', baseUrl: 'localhost:9/v1/' }),
      newId: 'local:unused',
    })
    expect(edited?.providers).toEqual([
      { id: 'local:a', name: 'Laptop', baseUrl: 'http://localhost:9/v1', modelId: 'x' },
      existing[1],
    ])
    const ftp = draftOf(local, null, { baseUrl: 'ftp://x.example' })
    expect(buildLocalProviderSave({ providers: [], saved: null, draft: ftp, newId: 'local:n' })).toBeNull()

    expect(shouldBecomeDefault({ defaultProviderId: 'arena-default', arenaDefaultReady: false })).toBe(true)
    expect(shouldBecomeDefault({ defaultProviderId: 'arena-default', arenaDefaultReady: true })).toBe(false)
    expect(shouldBecomeDefault({ defaultProviderId: 'acct:a1', arenaDefaultReady: false })).toBe(false)
  })

  test('a saved local provider: the last probe of the same server counts as its test', () => {
    const capability: AiLocalServerCapability = {
      reachable: true,
      models: ['x'],
      hostingClass: 'onDevice',
      contextTokens: null,
      baseUrl: 'http://localhost:1/v1',
      modelId: 'x',
      error: null,
    }
    const initial = getInitialLocalTest({ saved: savedLocal, capability, allowlist: [], pageProtocol: 'http:' })
    expect(initial?.local).toMatchObject({ reachable: true, models: ['x'], hostingClass: 'onDevice' })
    expect(isTestPassed({ test: initial, spec: local, draft: draftOf(local, savedLocal) })).toBe(true)
    const notProbed = { ...capability, reachable: null }
    expect(
      getInitialLocalTest({ saved: savedLocal, capability: notProbed, allowlist: [], pageProtocol: 'http:' })
    ).toBeNull()
    expect(
      getInitialLocalTest({ saved: savedLocal, capability: null, allowlist: [], pageProtocol: 'http:' })
    ).toBeNull()
    const moved = { ...capability, baseUrl: 'http://localhost:2/v1' }
    expect(
      getInitialLocalTest({ saved: savedLocal, capability: moved, allowlist: [], pageProtocol: 'http:' })
    ).toBeNull()
    expect(getInitialLocalTest({ saved: null, capability, allowlist: [], pageProtocol: 'http:' })).toBeNull()
  })

  test('message: the latency, the local address hint, the appErrors text, else the raw message', () => {
    /** Fake translation: the key, with the latency when given. */
    const t = (key: string, params?: Record<string, unknown>) =>
      params && 'latencyMs' in params ? `${key}:${params.latencyMs}` : key
    expect(
      getAccountTestMessage({ result: { ok: true, latencyMs: 42 }, spec: openai, baseUrl: '', allowlist, t })
    ).toBe('userAiSettings:dialog.testOk:42')
    expect(
      getAccountTestMessage({
        result: { ok: false, latencyMs: 0, errorKey: 'appErrors:aiBaseUrlNotAllowed' },
        spec: compatible,
        baseUrl: 'http://192.168.1.5:1234/v1',
        allowlist,
        t,
      })
    ).toBe('userAiSettings:dialog.localUrlHint')
    expect(
      getAccountTestMessage({
        result: { ok: false, latencyMs: 0, errorKey: 'aiProviderAuth' },
        spec: openai,
        baseUrl: '',
        allowlist,
        t,
      })
    ).toBe('appErrors:aiProviderAuth')
    expect(
      getAccountTestMessage({
        result: { ok: false, latencyMs: 0, errorMessage: 'boom' },
        spec: openai,
        baseUrl: '',
        allowlist,
        t,
      })
    ).toBe('boom')
  })
})
