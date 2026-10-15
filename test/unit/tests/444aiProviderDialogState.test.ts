import type { LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import { getApiErrorMessage, getErrorText } from '@webapp/components/ai/UserAiSettingsPanel/aiSettingsForm'
import {
  createInitialState,
  getProviderDialogView,
  type ProviderDialogAction,
  providerDialogReducer,
  type ProviderDialogState,
} from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerDialogState'
import {
  buildAccountRequest,
  canSaveDraft,
} from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerSave'
import {
  buildTestKey,
  type DraftTest,
  getAccountTestMessage,
  toFailedTestResult,
} from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerTest'
import {
  getProviderTypeSpec,
  type SavedProvider,
} from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerTypes'
import { fakeT as t } from '../utils/fakeT'

const allowlist = ['http://gpu.org.example:8000/v1']

const savedCompatible: SavedProvider = {
  id: 'acct:c1',
  kind: 'account',
  dialogType: 'openai-compatible',
  name: 'OpenAI-compatible',
  model: 'm1',
  baseUrl: 'https://openrouter.ai/api/v1',
  hasApiKey: true,
  apiKeyReadable: true,
}

const savedOpenai: SavedProvider = { ...savedCompatible, id: 'acct:o1', dialogType: 'openai', baseUrl: null }

const compatible = getProviderTypeSpec('openai-compatible')

/** Applies the actions in order. */
const run = (state: ProviderDialogState, ...actions: ProviderDialogAction[]) =>
  actions.reduce(providerDialogReducer, state)

const view = (state: ProviderDialogState, saved: SavedProvider | null) =>
  getProviderDialogView({ state, saved, allowlist })

const added = () => createInitialState({ saved: null, test: null })
const edited = (saved: SavedProvider) => createInitialState({ saved, test: null })

const localView = (models: string[]): LocalServerTestView =>
  ({ reachable: true, models, contextTokens: null, hostingClass: 'onDevice' }) as unknown as LocalServerTestView

describe('provider dialog state machine (444)', () => {
  describe('steps', () => {
    test('adding starts at the type step, editing at the connect step', () => {
      expect(added().step).toBe('type')
      expect(edited(savedCompatible).step).toBe('connect')
    })

    test('choosing a type opens a new draft of it and clears the list, the test and the error', () => {
      const dirty = run(
        added(),
        { type: 'typeChosen', dialogType: 'openai' },
        { type: 'nameSet', name: 'Mine' },
        { type: 'modelsRequested', inputsKey: 'k' },
        { type: 'saveFailed', message: 'boom' }
      )
      const next = run(dirty, { type: 'backToTypeStep' }, { type: 'typeChosen', dialogType: 'anthropic' })
      expect(next.step).toBe('connect')
      expect(next.draft.type).toBe('anthropic')
      expect(next.draft.name).toBe('')
      expect(next.models.list).toEqual([])
      expect(next.models.fetching).toBe(false)
      expect(next.models.inputsKey).toBeNull()
      expect(next.test).toBeNull()
      expect(next.saveError).toBeNull()
    })

    test('going back keeps the draft and drops the list in flight', () => {
      const connected = run(
        added(),
        { type: 'typeChosen', dialogType: 'openai' },
        { type: 'nameSet', name: 'Mine' },
        { type: 'modelsRequested', inputsKey: 'k' }
      )
      const requestId = connected.models.requestId
      const back = run(connected, { type: 'backToTypeStep' })
      expect(back.step).toBe('type')
      expect(back.draft.name).toBe('Mine')
      // the answer of the request that was in flight is stale now
      const late = run(back, { type: 'modelsLoaded', requestId, models: [{ id: 'm' }] })
      expect(late.models.list).toEqual([])
    })

    test('switching to a Local server keeps the typed address and name, and the step', () => {
      const state = run(
        added(),
        { type: 'typeChosen', dialogType: 'openai-compatible' },
        { type: 'baseUrlSet', baseUrl: 'http://localhost:1234/v1' },
        { type: 'nameSet', name: 'Desk' },
        { type: 'apiKeySet', apiKey: 'sk-x' },
        { type: 'switchedToLocal' }
      )
      expect(state.step).toBe('connect')
      expect(state.draft).toMatchObject({
        type: 'local',
        baseUrl: 'http://localhost:1234/v1',
        name: 'Desk',
        apiKey: '',
      })
    })
  })

  describe('model list', () => {
    const open = () => run(added(), { type: 'typeChosen', dialogType: 'openai-compatible' })

    test('a request marks the list as loading; its answer fills the list and picks the first model', () => {
      const requested = run(open(), { type: 'modelsRequested', inputsKey: 'a' })
      expect(requested.models).toMatchObject({ fetching: true, error: null, inputsKey: 'a' })
      const loaded = run(requested, {
        type: 'modelsLoaded',
        requestId: requested.models.requestId,
        models: [{ id: 'x' }, { id: 'y' }],
      })
      expect(loaded.models.fetching).toBe(false)
      expect(loaded.models.list).toHaveLength(2)
      expect(loaded.draft.model).toBe('x')
    })

    test('only the answer of the latest request counts', () => {
      const first = run(open(), { type: 'modelsRequested', inputsKey: 'a' })
      const firstId = first.models.requestId
      const second = run(first, { type: 'modelsRequested', inputsKey: 'b' })
      const lateFirst = run(second, { type: 'modelsLoaded', requestId: firstId, models: [{ id: 'old' }] })
      expect(lateFirst).toBe(second)
      const lateFailure = run(second, { type: 'modelsFailed', requestId: firstId, message: 'old error' })
      expect(lateFailure).toBe(second)
      // the loading state stays until the latest answer arrives
      expect(lateFailure.models.fetching).toBe(true)
    })

    test('a failed request clears the list and keeps the message', () => {
      const requested = run(open(), { type: 'modelsRequested', inputsKey: 'a' })
      const failed = run(requested, {
        type: 'modelsFailed',
        requestId: requested.models.requestId,
        message: 'no route',
      })
      expect(failed.models).toMatchObject({ list: [], fetching: false, error: 'no route' })
    })

    test('a typed model that is not listed stays; Other switches to free text', () => {
      const requested = run(
        open(),
        { type: 'modelSet', model: 'my-deployment' },
        { type: 'modelsRequested', inputsKey: 'a' }
      )
      const loaded = run(requested, {
        type: 'modelsLoaded',
        requestId: requested.models.requestId,
        models: [{ id: 'x' }],
      })
      expect(loaded.draft).toMatchObject({ model: 'my-deployment', modelFreeText: true })
      const picked = run(loaded, { type: 'modelSelected', value: 'x' })
      expect(picked.draft).toMatchObject({ model: 'x', modelFreeText: false })
      const other = run(picked, { type: 'modelSelected', value: '__other__' })
      expect(other.draft).toMatchObject({ model: 'x', modelFreeText: true })
    })
  })

  describe('test and save', () => {
    const connected = () =>
      run(
        added(),
        { type: 'typeChosen', dialogType: 'openai-compatible' },
        { type: 'baseUrlSet', baseUrl: 'https://openrouter.ai/api/v1' },
        { type: 'modelSet', model: 'm1' }
      )

    const passing = (state: ProviderDialogState): DraftTest => ({
      key: buildTestKey({ spec: compatible, draft: state.draft }),
      account: { ok: true, latencyMs: 5 },
      local: null,
    })

    test('a test starts clean, ends with its result, and enables saving only for the tested values', () => {
      const state = connected()
      const started = run(state, { type: 'testStarted' })
      expect(started).toMatchObject({ testing: true, test: null })
      expect(view(started, null).canSave).toBe(false)
      const tested = run(started, { type: 'accountTested', test: passing(state) }, { type: 'testEnded' })
      expect(tested.testing).toBe(false)
      expect(view(tested, null).canSave).toBe(true)
      // any edit after the test needs a new one
      const edited2 = run(tested, { type: 'baseUrlSet', baseUrl: 'https://other.example/v1' })
      expect(view(edited2, null).canSave).toBe(false)
      expect(view(edited2, null).test).toBeNull()
    })

    test('a result of an older key never matches the draft', () => {
      const state = run(connected(), { type: 'apiKeySet', apiKey: 'sk-1' })
      const tested = run(state, { type: 'accountTested', test: passing(state) })
      expect(view(tested, null).canSave).toBe(true)
      const retyped = run(tested, { type: 'apiKeySet', apiKey: 'sk-2' })
      expect(view(retyped, null).canSave).toBe(false)
    })

    test('a local test stores the address as saved and picks a listed model', () => {
      const state = run(added(), { type: 'typeChosen', dialogType: 'local' }, { type: 'modelSet', model: 'gone' })
      const tested = run(state, {
        type: 'localTested',
        baseUrl: 'http://localhost:1234/v1',
        reachable: true,
        models: ['gemma', 'qwen'],
        view: localView(['gemma', 'qwen']),
      })
      expect(tested.draft).toMatchObject({ baseUrl: 'http://localhost:1234/v1', model: 'gemma' })
      expect(view(tested, null).test).not.toBeNull()
      expect(view(tested, null).canSave).toBe(true)
    })

    test('saving: busy while it runs, an error stays in the dialog, and Test and Save are off meanwhile', () => {
      const state = run(connected(), { type: 'accountTested', test: passing(connected()) })
      const saving = run(state, { type: 'saveStarted' })
      expect(saving.saving).toBe(true)
      expect(view(saving, null)).toMatchObject({ canSave: false, canTest: false })
      const failed = run(saving, { type: 'saveFailed', message: 'refused' }, { type: 'saveEnded' })
      expect(failed).toMatchObject({ saving: false, saveError: 'refused' })
      expect(view(failed, null).canSave).toBe(true)
      expect(run(failed, { type: 'saveStarted' }).saveError).toBeNull()
    })

    test('the dialog of a saved local server opens with the last probe as its test', () => {
      const saved: SavedProvider = {
        id: 'local:a',
        kind: 'local',
        dialogType: 'local',
        name: 'A',
        model: 'x',
        baseUrl: 'http://localhost:1/v1',
        hasApiKey: false,
        apiKeyReadable: false,
      }
      const test: DraftTest = {
        key: buildTestKey({
          spec: getProviderTypeSpec('local'),
          draft: createInitialState({ saved, test: null }).draft,
        }),
        account: null,
        local: localView(['x']),
      }
      const state = createInitialState({ saved, test })
      expect(view(state, saved).test).toBe(test)
    })
  })

  describe('API key', () => {
    test('removing the key of a saved provider asks for a test and sends an empty key', () => {
      const state = edited(savedCompatible)
      expect(view(state, savedCompatible).canRemoveKey).toBe(true)
      const removed = run(state, { type: 'apiKeyRemoved' })
      expect(removed.draft).toMatchObject({ apiKey: '', apiKeyRemoved: true })
      expect(buildAccountRequest({ spec: compatible, draft: removed.draft, saved: savedCompatible })).toMatchObject({
        id: 'acct:c1',
        apiKey: '',
      })
      // the connection changed: a test of the new connection is needed
      expect(canSaveDraft({ spec: compatible, draft: removed.draft, saved: savedCompatible, test: null })).toBe(false)
      expect(view(removed, savedCompatible)).toMatchObject({ canRemoveKey: false, keyMissing: false, canTest: true })
    })

    test('keeping the key again, or typing a new one, cancels the removal', () => {
      const removed = run(edited(savedCompatible), { type: 'apiKeyRemoved' })
      const kept = run(removed, { type: 'apiKeyKept' })
      expect(kept.draft.apiKeyRemoved).toBe(false)
      expect(buildAccountRequest({ spec: compatible, draft: kept.draft, saved: savedCompatible })).not.toHaveProperty(
        'apiKey'
      )
      const typed = run(removed, { type: 'apiKeySet', apiKey: 'sk-new' })
      expect(typed.draft.apiKeyRemoved).toBe(false)
      expect(buildAccountRequest({ spec: compatible, draft: typed.draft, saved: savedCompatible })).toMatchObject({
        apiKey: 'sk-new',
      })
    })

    test('each key edit changes the test key, so an older test never matches', () => {
      const state = edited(savedCompatible)
      const keys = [
        state,
        run(state, { type: 'apiKeyRemoved' }),
        run(state, { type: 'apiKeyRemoved' }, { type: 'apiKeyKept' }),
      ].map((s) => buildTestKey({ spec: compatible, draft: s.draft }))
      expect(new Set(keys).size).toBe(3)
    })

    test('a cloud type that needs its key cannot drop it', () => {
      const state = edited(savedOpenai)
      expect(view(state, savedOpenai).canRemoveKey).toBe(false)
      // even when forced, the draft stays untestable without a key
      const removed = run(state, { type: 'apiKeyRemoved' })
      expect(view(removed, savedOpenai)).toMatchObject({ keyMissing: true, canTest: false })
    })

    test('a provider without a saved key has nothing to remove', () => {
      const noKey = { ...savedCompatible, hasApiKey: false }
      expect(view(edited(noKey), noKey).canRemoveKey).toBe(false)
    })
  })

  describe('closing', () => {
    test('a model the user typed or picked makes the dialog dirty, one filled in from the list does not', () => {
      const open = run(added(), { type: 'typeChosen', dialogType: 'openai-compatible' })
      const requested = run(open, { type: 'modelsRequested', inputsKey: 'a' })
      const filled = run(requested, {
        type: 'modelsLoaded',
        requestId: requested.models.requestId,
        models: [{ id: 'x' }, { id: 'y' }],
      })
      expect(filled.draft.model).toBe('x')
      expect(view(filled, null).dirty).toBe(false)
      expect(view(run(filled, { type: 'modelSelected', value: 'y' }), null).dirty).toBe(true)
      expect(view(run(open, { type: 'modelSet', model: 'my-deployment' }), null).dirty).toBe(true)
      // typing the model that was there already changes nothing
      const saved = edited(savedCompatible)
      expect(view(run(saved, { type: 'modelSet', model: 'm1' }), savedCompatible).dirty).toBe(false)
      expect(view(run(saved, { type: 'modelSet', model: 'm2' }), savedCompatible).dirty).toBe(true)
    })

    test('typed values make the dialog dirty', () => {
      const state = run(added(), { type: 'typeChosen', dialogType: 'openai' })
      expect(view(state, null).dirty).toBe(false)
      expect(view(run(state, { type: 'nameSet', name: 'x' }), null).dirty).toBe(true)
      expect(view(run(state, { type: 'apiKeySet', apiKey: 'sk-1' }), null).dirty).toBe(true)
      expect(view(run(state, { type: 'modelSet', model: 'gpt' }), null).dirty).toBe(true)
    })

    test('an opened saved provider is clean; changing its address or removing its key makes it dirty', () => {
      const state = edited(savedCompatible)
      expect(view(state, savedCompatible).dirty).toBe(false)
      expect(view(run(state, { type: 'baseUrlSet', baseUrl: 'https://x.example' }), savedCompatible).dirty).toBe(true)
      expect(view(run(state, { type: 'apiKeyRemoved' }), savedCompatible).dirty).toBe(true)
    })
  })

  describe('error text', () => {
    // a stand-in for i18next: the key and its params

    test('a server key is translated without HTML escaping, the prefix is optional', () => {
      const params = { url: 'https://x.example/a&b' }
      const expected = `appErrors:aiBaseUrlNotAllowed${JSON.stringify({ ...params, interpolation: { escapeValue: false } })}`
      expect(getErrorText({ key: 'aiBaseUrlNotAllowed', params, t })).toBe(expected)
      expect(getErrorText({ key: 'appErrors:aiBaseUrlNotAllowed', params, t })).toBe(expected)
    })

    test('without a key the message is shown, and without a message the translated unknown error', () => {
      expect(getErrorText({ message: 'Network Error', t })).toBe('Network Error')
      expect(getErrorText({ t })).toBe('userAiSettings:unknownError')
      expect(getErrorText({ message: '', t })).toBe('userAiSettings:unknownError')
    })

    test('an API error reads the response first, then the message of the error', () => {
      const withKey = { response: { data: { key: 'aiKeyInvalid' } }, message: 'Request failed' }
      expect(getApiErrorMessage({ error: withKey, t })).toContain('appErrors:aiKeyInvalid')
      expect(getApiErrorMessage({ error: { response: { data: { error: 'Boom' } }, message: 'x' }, t })).toBe('Boom')
      expect(getApiErrorMessage({ error: new Error('Network Error'), t })).toBe('Network Error')
      expect(getApiErrorMessage({ error: undefined, t })).toBe('userAiSettings:unknownError')
    })

    test('a failed test request keeps the key and params; one without details reads as unknown', () => {
      const failed = toFailedTestResult({ response: { data: { key: 'aiKeyInvalid', params: { p: 1 } } } })
      expect(failed).toMatchObject({ ok: false, errorKey: 'aiKeyInvalid', errorParams: { p: 1 } })
      const message = (result: ReturnType<typeof toFailedTestResult>) =>
        getAccountTestMessage({ result, spec: compatible, baseUrl: 'https://x.example', allowlist, t })
      expect(message(toFailedTestResult(undefined))).toBe('userAiSettings:unknownError')
      expect(message(toFailedTestResult(new Error('timeout')))).toBe('timeout')
    })
  })
})
