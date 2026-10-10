import { DEFAULT_LOCAL_SERVER_BASE_URL, getLocalServerSettingsKey } from '@webapp/ai/engines/localServerSettings'
import type { LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import type { AiLocalServerCapability, AiLocalServerSettings, StorageLike } from '@webapp/ai/engines/types'
import {
  acceptLocalTestResult,
  commitLocalBaseUrl,
  getCurrentLocalTestView,
  isLocalDraftChanged,
  listLocalModels,
  normalizeLocalBaseUrl,
  pickProbedModel,
  saveAiPanelSettings,
  saveLocalDraft,
} from '@webapp/components/ai/UserAiSettingsPanel/localServerDraft'

const USER = 'user-1'
const BASE_URL = 'http://localhost:1234/v1'
const OTHER_URL = 'http://127.0.0.1:1235/v1'

const saved: AiLocalServerSettings = { enabled: true, baseUrl: BASE_URL, modelId: 'model-a', preferLocal: true }

const fakeStorage = ({ failing = false }: { failing?: boolean } = {}) => {
  const data = new Map<string, string>()
  const writes: string[] = []
  const storage: StorageLike = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      if (failing) throw new Error('QuotaExceededError')
      writes.push(key)
      data.set(key, value)
    },
  }
  return { storage, data, writes }
}

const testView = (overrides: Partial<LocalServerTestView> = {}): LocalServerTestView => ({
  reachable: true,
  models: ['model-a', 'model-b'],
  hostingClass: 'onDevice',
  contextTokens: 4096,
  error: null,
  showHttpsHint: false,
  showCloudWarning: false,
  ...overrides,
})

const capability = (overrides: Partial<AiLocalServerCapability> = {}): AiLocalServerCapability => ({
  enabled: true,
  reachable: true,
  models: ['model-a'],
  hostingClass: 'onDevice',
  contextTokens: 4096,
  baseUrl: BASE_URL,
  modelId: 'model-a',
  error: null,
  ...overrides,
})

// records the order of the save steps
const recorder = () => {
  const calls: string[] = []
  return {
    calls,
    saveServer: async () => {
      calls.push('server')
      return 'saved'
    },
    failingServer: async (): Promise<string> => {
      calls.push('server')
      throw new Error('PUT failed')
    },
    saveLocal: (ok: boolean) => () => {
      calls.push('local')
      return ok
    },
    refresh: async () => {
      calls.push('refresh')
    },
    failingRefresh: async () => {
      calls.push('refresh')
      throw new Error('offline')
    },
  }
}

describe('local draft', () => {
  test('URLs are compared normalized', () => {
    expect(normalizeLocalBaseUrl(`  ${BASE_URL}//  `)).toBe(BASE_URL)
    expect(normalizeLocalBaseUrl('')).toBe(DEFAULT_LOCAL_SERVER_BASE_URL)
    expect(isLocalDraftChanged({ draft: { ...saved, baseUrl: `${BASE_URL}/` }, saved })).toBe(false)
    expect(isLocalDraftChanged({ draft: { ...saved, modelId: 'model-b' }, saved })).toBe(true)
    expect(isLocalDraftChanged({ draft: { ...saved, preferLocal: false }, saved })).toBe(true)
    expect(isLocalDraftChanged({ draft: { ...saved, enabled: false }, saved })).toBe(true)
  })

  test('committing the URL keeps the model of the same server and drops it for another one', () => {
    const same = commitLocalBaseUrl({ draft: { ...saved, baseUrl: ` ${BASE_URL}/ ` }, committedBaseUrl: BASE_URL })
    expect(same).toEqual(saved)
    const other = commitLocalBaseUrl({ draft: { ...saved, baseUrl: OTHER_URL }, committedBaseUrl: BASE_URL })
    expect(other).toEqual({ ...saved, baseUrl: OTHER_URL, modelId: null })
    const unchanged = { ...saved }
    expect(commitLocalBaseUrl({ draft: unchanged, committedBaseUrl: BASE_URL })).toBe(unchanged)
  })

  test('keeps a listed model, else picks the first one; an unreachable server keeps the choice', () => {
    expect(pickProbedModel({ reachable: true, models: ['model-a', 'model-b'], modelId: 'model-b' })).toBe('model-b')
    expect(pickProbedModel({ reachable: true, models: ['model-a'], modelId: 'gone' })).toBe('model-a')
    expect(pickProbedModel({ reachable: true, models: [], modelId: 'gone' })).toBeNull()
    expect(pickProbedModel({ reachable: false, models: [], modelId: 'model-a' })).toBe('model-a')
  })

  test('the model list keeps the chosen model once', () => {
    expect(listLocalModels({ testView: testView(), modelId: 'model-z' })).toEqual(['model-z', 'model-a', 'model-b'])
    expect(listLocalModels({ testView: testView(), modelId: 'model-a' })).toEqual(['model-a', 'model-b'])
    expect(listLocalModels({ testView: null, modelId: 'model-a' })).toEqual(['model-a'])
    expect(listLocalModels({ testView: null, modelId: null })).toEqual([])
  })

  test('a Test result is ignored after a URL edit or a user switch', () => {
    const params = {
      testedUserUuid: USER,
      currentUserUuid: USER,
      testedBaseUrl: BASE_URL,
      currentBaseUrl: `${BASE_URL}/`,
    }
    expect(acceptLocalTestResult(params)).toBe(true)
    expect(acceptLocalTestResult({ ...params, currentBaseUrl: OTHER_URL })).toBe(false)
    expect(acceptLocalTestResult({ ...params, currentUserUuid: 'user-2' })).toBe(false)
    expect(acceptLocalTestResult({ ...params, currentUserUuid: null })).toBe(false)
  })
})

describe('the result shown', () => {
  const base = { allowlist: [], pageProtocol: 'http:' }

  test("this session's Test of the current URL wins", () => {
    const view = testView({ models: ['model-b'] })
    const shown = getCurrentLocalTestView({
      ...base,
      draft: saved,
      sessionTest: { baseUrl: BASE_URL, view },
      capability: capability(),
    })
    expect(shown).toBe(view)
  })

  test("without a Test, the app's probe of the saved server is shown", () => {
    const shown = getCurrentLocalTestView({
      ...base,
      draft: saved,
      sessionTest: { baseUrl: OTHER_URL, view: testView() },
      capability: capability(),
    })
    expect(shown).toMatchObject({ reachable: true, models: ['model-a'], hostingClass: 'onDevice' })
  })

  test('nothing for another URL, a server not probed yet, or a disabled one', () => {
    const params = { ...base, sessionTest: null }
    expect(
      getCurrentLocalTestView({ ...params, draft: { ...saved, baseUrl: OTHER_URL }, capability: capability() })
    ).toBeNull()
    expect(getCurrentLocalTestView({ ...params, draft: saved, capability: capability({ reachable: null }) })).toBeNull()
    expect(getCurrentLocalTestView({ ...params, draft: saved, capability: capability({ enabled: false }) })).toBeNull()
  })
})

describe('saving the local draft', () => {
  test('nothing reaches the storage before a change', () => {
    const { storage, writes } = fakeStorage()
    const result = saveLocalDraft({ storage, userUuid: USER, draft: { ...saved, baseUrl: `${BASE_URL}/` }, saved })
    expect(result).toEqual({ ok: true, saved })
    expect(result.saved).toBe(saved)
    expect(writes).toEqual([])
  })

  test('a change is written once, normalized', () => {
    const { storage, data, writes } = fakeStorage()
    const draft = { ...saved, baseUrl: ` ${OTHER_URL}/ `, modelId: 'model-b' }
    const result = saveLocalDraft({ storage, userUuid: USER, draft, saved })
    expect(result).toEqual({ ok: true, saved: { ...saved, baseUrl: OTHER_URL, modelId: 'model-b' } })
    expect(writes).toEqual([getLocalServerSettingsKey(USER)])
    expect(JSON.parse(data.get(getLocalServerSettingsKey(USER))!)).toEqual(result.saved)
  })

  test('blocked or full storage: not saved, so the draft stays dirty', () => {
    const draft = { ...saved, modelId: 'model-b' }
    const { storage } = fakeStorage({ failing: true })
    const result = saveLocalDraft({ storage, userUuid: USER, draft, saved })
    expect(result).toEqual({ ok: false, saved })
    expect(isLocalDraftChanged({ draft, saved: result.saved })).toBe(true)
    expect(saveLocalDraft({ storage: null, userUuid: USER, draft, saved }).ok).toBe(false)
    expect(saveLocalDraft({ storage: fakeStorage().storage, userUuid: null, draft, saved }).ok).toBe(false)
  })
})

describe('saveAiPanelSettings', () => {
  test('account settings, then local settings, then one refresh', async () => {
    const steps = recorder()
    const result = await saveAiPanelSettings({
      saveServer: steps.saveServer,
      saveLocal: steps.saveLocal(true),
      refresh: steps.refresh,
    })
    expect(result).toEqual({ server: 'saved', localSaved: true })
    expect(steps.calls).toEqual(['server', 'local', 'refresh'])
  })

  test('a failed PUT writes nothing locally and refreshes nothing', async () => {
    const steps = recorder()
    await expect(
      saveAiPanelSettings({ saveServer: steps.failingServer, saveLocal: steps.saveLocal(true), refresh: steps.refresh })
    ).rejects.toThrow('PUT failed')
    expect(steps.calls).toEqual(['server'])
  })

  test('only local changes: no PUT', async () => {
    const steps = recorder()
    const result = await saveAiPanelSettings({
      saveServer: null,
      saveLocal: steps.saveLocal(true),
      refresh: steps.refresh,
    })
    expect(result).toEqual({ server: null, localSaved: true })
    expect(steps.calls).toEqual(['local', 'refresh'])
  })

  test('refused storage still refreshes, and a failing refresh stays quiet', async () => {
    const steps = recorder()
    const result = await saveAiPanelSettings({
      saveServer: null,
      saveLocal: steps.saveLocal(false),
      refresh: steps.failingRefresh,
    })
    expect(result).toEqual({ server: null, localSaved: false })
    expect(steps.calls).toEqual(['local', 'refresh'])
  })
})
