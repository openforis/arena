/**
 * State machine of the add / edit provider dialog: a reducer over the step, the draft, the model list, the test and
 * the save, and the view derived from it. Every change of the state is an action, so the async work (list, test, save)
 * only reports what happened. Pure.
 */
import { shouldShowLocalUrlHint, isOrgServerUrlRefused } from './providerAddress'
import { createDraft, isDraftDirty, type ProviderDraft } from './providerDraft'
import { canRemoveKey, isApiKeyCleared, isApiKeyMissing } from './providerKey'
import { type AiModel, listLocalModels, OTHER_MODEL_VALUE, pickLocalModel, resolveFetchedModel } from './providerModels'
import { canSaveDraft } from './providerSave'
import { buildTestKey, canTestDraft, type DraftTest } from './providerTest'
import type { LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import {
  getProviderTypeSpec,
  type ProviderDialogType,
  type ProviderTypeSpec,
  type SavedProvider,
} from './providerTypes'

export type ProviderDialogContext = {
  allowlist: string[]
  encryptionConfigured: boolean
  mockEnabled: boolean
  defaultProviderId: string
  arenaDefaultReady: boolean
}

export type ProviderDialogStep = 'type' | 'connect'

export type ModelsState = {
  list: AiModel[]
  fetching: boolean
  error: string | null
  // incremented on every request and on a reset: only the answer of the latest request is applied
  requestId: number
  // the inputs of the latest request: the same inputs are not requested twice
  inputsKey: string | null
}

export type ProviderDialogState = {
  step: ProviderDialogStep
  draft: ProviderDraft
  models: ModelsState
  // the result of the last test, kept until a new test starts or the dialog is reset
  test: DraftTest | null
  testing: boolean
  saving: boolean
  saveError: string | null
}

export type ProviderDialogAction =
  | { type: 'typeChosen'; dialogType: ProviderDialogType }
  | { type: 'backToTypeStep' }
  // the address typed for a cloud type is on this computer or network: a new Local server draft with it
  | { type: 'switchedToLocal' }
  | { type: 'nameSet'; name: string }
  | { type: 'baseUrlSet'; baseUrl: string }
  | { type: 'apiKeySet'; apiKey: string }
  | { type: 'apiKeyRemoved' }
  | { type: 'apiKeyKept' }
  | { type: 'modelSet'; model: string }
  | { type: 'modelSelected'; value: string }
  | { type: 'modelsRequested'; inputsKey: string }
  | { type: 'modelsLoaded'; requestId: number; models: AiModel[] }
  | { type: 'modelsFailed'; requestId: number; message: string }
  | { type: 'testStarted' }
  | { type: 'accountTested'; test: DraftTest }
  | { type: 'localTested'; baseUrl: string; reachable: boolean; models: string[]; view: LocalServerTestView }
  | { type: 'testEnded' }
  | { type: 'saveStarted' }
  | { type: 'saveFailed'; message: string }
  | { type: 'saveEnded' }

const NO_MODELS: ModelsState = { list: [], fetching: false, error: null, requestId: 0, inputsKey: null }

/**
 * Returns the model state after a reset: no list, and the answer of a request in flight is dropped.
 * @param {ModelsState} models - Model state.
 * @returns {ModelsState} The cleared state.
 */
const resetModels = (models: ModelsState): ModelsState => ({ ...NO_MODELS, requestId: models.requestId + 1 })

/**
 * Returns the state of a new draft: no list, test or error.
 * @param {ProviderDialogState} state - State.
 * @param {ProviderDraft} draft - The new draft.
 * @param {ProviderDialogStep} step - The step to show.
 * @returns {ProviderDialogState} The new state.
 */
const withNewDraft = (state: ProviderDialogState, draft: ProviderDraft, step: ProviderDialogStep) => ({
  ...state,
  step,
  draft,
  models: resetModels(state.models),
  test: null,
  saveError: null,
})

/**
 * Returns the state for the dialog when it opens.
 * @param {object} params - Parameters.
 * @param {SavedProvider|null} params.saved - Saved provider (edit), null to add.
 * @param {DraftTest|null} params.test - The test the dialog opens with (the app's last probe of a saved local server).
 * @returns {ProviderDialogState} The state: step 2 when editing, else step 1.
 */
export const createInitialState = ({
  saved,
  test,
}: {
  saved: SavedProvider | null
  test: DraftTest | null
}): ProviderDialogState => ({
  step: saved ? 'connect' : 'type',
  draft: createDraft({ type: saved?.dialogType ?? 'local', saved }),
  models: NO_MODELS,
  test,
  testing: false,
  saving: false,
  saveError: null,
})

/**
 * Returns the draft with a key edit: any edit (also removing it or keeping it) bumps the counter, so a test of an
 * older key never matches.
 * @param {ProviderDraft} draft - Draft.
 * @param {Partial<ProviderDraft>} patch - The key fields.
 * @returns {ProviderDraft} The draft.
 */
const withKeyEdit = (draft: ProviderDraft, patch: Partial<ProviderDraft>): ProviderDraft => ({
  ...draft,
  ...patch,
  apiKeyVersion: draft.apiKeyVersion + 1,
})

/**
 * Returns the state after a list answer: a stale answer changes nothing.
 * @param {ProviderDialogState} state - State.
 * @param {number} requestId - The request the answer belongs to.
 * @param {Partial<ModelsState>} patch - The models state to apply.
 * @returns {ProviderDialogState} The new state, or the same one for a stale answer.
 */
const withModelsAnswer = (state: ProviderDialogState, requestId: number, patch: Partial<ModelsState>) =>
  requestId === state.models.requestId ? { ...state, models: { ...state.models, fetching: false, ...patch } } : state

/**
 * Returns the state after the model list arrived: the draft keeps its model (or takes the first listed one).
 * @param {ProviderDialogState} state - State.
 * @param {AiModel[]} list - Listed models.
 * @returns {ProviderDialogState} The new state.
 */
const withModelsLoaded = (state: ProviderDialogState, list: AiModel[]): ProviderDialogState => {
  const models = { ...state.models, list, fetching: false, error: null }
  if (list.length === 0) return { ...state, models }
  return { ...state, models, draft: { ...state.draft, ...resolveFetchedModel({ draft: state.draft, models: list }) } }
}

/**
 * Returns the state after a local test: the address as stored, the model the server lists, and the result.
 * @param {ProviderDialogState} state - State.
 * @param {object} action - The `localTested` action.
 * @returns {ProviderDialogState} The new state.
 */
const withLocalTested = (
  state: ProviderDialogState,
  { baseUrl, reachable, models, view }: Extract<ProviderDialogAction, { type: 'localTested' }>
): ProviderDialogState => {
  const draft = { ...state.draft, baseUrl, model: pickLocalModel({ reachable, models, model: state.draft.model }) }
  const test = { key: buildTestKey({ spec: getProviderTypeSpec('local'), draft }), account: null, local: view }
  return { ...state, draft, test }
}

/**
 * Returns the draft after a field edit, or null when the action is not one.
 * @param {ProviderDraft} draft - Draft.
 * @param {ProviderDialogAction} action - Action.
 * @returns {ProviderDraft|null} The new draft.
 */
const reduceDraftEdit = (draft: ProviderDraft, action: ProviderDialogAction): ProviderDraft | null => {
  switch (action.type) {
    case 'nameSet':
      return { ...draft, name: action.name }
    case 'baseUrlSet':
      return { ...draft, baseUrl: action.baseUrl }
    case 'apiKeySet':
      return withKeyEdit(draft, { apiKey: action.apiKey, apiKeyRemoved: false })
    case 'apiKeyRemoved':
      return withKeyEdit(draft, { apiKey: '', apiKeyRemoved: true })
    case 'apiKeyKept':
      return withKeyEdit(draft, { apiKeyRemoved: false })
    case 'modelSet':
      return { ...draft, model: action.model }
    case 'modelSelected':
      return action.value === OTHER_MODEL_VALUE
        ? { ...draft, modelFreeText: true }
        : { ...draft, model: action.value, modelFreeText: false }
    default:
      return null
  }
}

/**
 * Returns the state after the test or save progress, or null when the action is not one.
 * @param {ProviderDialogState} state - State.
 * @param {ProviderDialogAction} action - Action.
 * @returns {ProviderDialogState|null} The new state.
 */
const reduceProgress = (state: ProviderDialogState, action: ProviderDialogAction): ProviderDialogState | null => {
  switch (action.type) {
    case 'testStarted':
      return { ...state, testing: true, test: null, saveError: null }
    case 'accountTested':
      return { ...state, test: action.test }
    case 'localTested':
      return withLocalTested(state, action)
    case 'testEnded':
      return { ...state, testing: false }
    case 'saveStarted':
      return { ...state, saving: true, saveError: null }
    case 'saveFailed':
      return { ...state, saveError: action.message }
    case 'saveEnded':
      return { ...state, saving: false }
    default:
      return null
  }
}

/**
 * Returns the state after an action.
 * @param {ProviderDialogState} state - State.
 * @param {ProviderDialogAction} action - Action.
 * @returns {ProviderDialogState} The new state (the same one when nothing changes).
 */
export const providerDialogReducer = (
  state: ProviderDialogState,
  action: ProviderDialogAction
): ProviderDialogState => {
  switch (action.type) {
    case 'typeChosen':
      return withNewDraft(state, createDraft({ type: action.dialogType, saved: null }), 'connect')
    case 'backToTypeStep':
      return withNewDraft(state, state.draft, 'type')
    case 'switchedToLocal': {
      const { baseUrl, name } = state.draft
      return withNewDraft(state, { ...createDraft({ type: 'local', saved: null }), baseUrl, name }, state.step)
    }
    case 'modelsRequested':
      return {
        ...state,
        models: {
          ...state.models,
          fetching: true,
          error: null,
          requestId: state.models.requestId + 1,
          inputsKey: action.inputsKey,
        },
      }
    case 'modelsLoaded':
      return action.requestId === state.models.requestId ? withModelsLoaded(state, action.models) : state
    case 'modelsFailed':
      return withModelsAnswer(state, action.requestId, { list: [], error: action.message })
    default: {
      const draft = reduceDraftEdit(state.draft, action)
      return draft ? { ...state, draft } : (reduceProgress(state, action) ?? state)
    }
  }
}

export type ProviderDialogView = {
  spec: ProviderTypeSpec
  // the test, only while it matches the current values
  test: DraftTest | null
  // the options of the Local server's Model select
  localModels: string[]
  keyCleared: boolean
  keyMissing: boolean
  canRemoveKey: boolean
  localUrlHint: boolean
  orgServerRefused: boolean
  canTest: boolean
  canSave: boolean
  // typed values a stray click would lose
  dirty: boolean
}

/**
 * Returns what the dialog shows and enables for a state.
 * @param {object} params - Parameters.
 * @param {ProviderDialogState} params.state - State.
 * @param {SavedProvider|null} params.saved - Saved provider (edit), null to add.
 * @param {string[]} params.allowlist - Org-hosted base URLs.
 * @returns {ProviderDialogView} The view.
 */
export const getProviderDialogView = ({
  state,
  saved,
  allowlist,
}: {
  state: ProviderDialogState
  saved: SavedProvider | null
  allowlist: string[]
}): ProviderDialogView => {
  const { draft, testing, saving } = state
  const spec = getProviderTypeSpec(draft.type)
  const keyParams = { spec, draft, saved }
  const test = state.test && state.test.key === buildTestKey({ spec, draft }) ? state.test : null
  const idle = !testing && !saving
  return {
    spec,
    test,
    localModels: listLocalModels({ view: test?.local ?? null, model: draft.model }),
    keyCleared: isApiKeyCleared(keyParams),
    keyMissing: isApiKeyMissing(keyParams),
    canRemoveKey: canRemoveKey(keyParams),
    localUrlHint: shouldShowLocalUrlHint({ spec, baseUrl: draft.baseUrl, allowlist }),
    orgServerRefused: isOrgServerUrlRefused({ spec, baseUrl: draft.baseUrl, allowlist }),
    canTest: idle && canTestDraft({ ...keyParams, allowlist }),
    canSave: idle && canSaveDraft({ ...keyParams, test: state.test }),
    dirty: isDraftDirty({ draft, saved }),
  }
}
