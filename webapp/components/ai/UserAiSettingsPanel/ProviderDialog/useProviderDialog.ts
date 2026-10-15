/**
 * The add / edit provider dialog: wires the state machine (providerDialogState) to the server. The dialog stores
 * nothing before "Add provider" / "Save"; then the settings cache and the capabilities are refreshed.
 */
import { useCallback, useEffect, useMemo } from 'react'

import { createLocalProviderId } from '@common/ai/providerIds'
import { uuidv4 } from '@core/uuid'

import * as API from '@webapp/service/api'
import type { AiProviderRequest, AiProviderTestResponse } from '@webapp/service/api/ai/providers'

import { getCurrentUserUuid, refreshAiCapabilities, testLocalServer } from '@webapp/ai/engines/capabilitiesStore'
import { loadLocalProviders, saveLocalProviders } from '@webapp/ai/engines/localProviders'
import { getBrowserStorage } from '@webapp/ai/engines/localServerSettings'
import { getLocalServerTestView } from '@webapp/ai/engines/localServerTest'
import { useAiCapabilities } from '@webapp/components/ai/hooks/useAiCapabilities'
import { invalidateAiSettingsCache } from '@webapp/components/ai/hooks/useAiFeatureEnabled'

import { getApiErrorMessage } from '../aiSettingsForm'
import { useT } from '../useT'
import { getLocalDraftUrl } from './providerDraft'
import { buildLocalProviderSave, buildAccountRequest, shouldBecomeDefault } from './providerSave'
import { canListModels } from './providerModels'
import {
  createInitialState,
  getProviderDialogView,
  type ProviderDialogContext,
  providerDialogReducer,
  type ProviderDialogState,
  type ProviderDialogView,
} from './providerDialogState'
import { buildTestKey, getInitialLocalTest, toFailedTestResult } from './providerTest'
import {
  getProviderTypeGroups,
  getProviderTypeSpec,
  type ProviderDialogType,
  type ProviderTypeGroup,
  type SavedProvider,
} from './providerTypes'
import { canSaveDraft } from './providerSave'
import { useLatestReducer } from './useLatestReducer'

export type ProviderDialogActions = {
  chooseType: (type: ProviderDialogType) => void
  back: () => void
  switchToLocalServer: () => void
  setName: (name: string) => void
  setBaseUrl: (baseUrl: string) => void
  commitBaseUrl: () => void
  setApiKey: (apiKey: string) => void
  commitApiKey: () => void
  removeKey: () => void
  keepKey: () => void
  setModel: (model: string) => void
  selectModel: (value: string) => void
  runTest: () => Promise<void>
  save: () => Promise<void>
}

export type ProviderDialogApi = {
  state: ProviderDialogState
  view: ProviderDialogView
  groups: ProviderTypeGroup[]
  actions: ProviderDialogActions
}

type Params = {
  saved: SavedProvider | null
  context: ProviderDialogContext
  onSaved: () => void
}

/**
 * Tests an account draft; a failed request becomes a failed result.
 * @param {AiProviderRequest} request - Request body.
 * @returns {Promise<AiProviderTestResponse>} The result.
 */
const testAccountDraft = async (request: AiProviderRequest): Promise<AiProviderTestResponse> => {
  try {
    return await API.aiProviders.testProvider(request)
  } catch (error) {
    return toFailedTestResult(error)
  }
}

/**
 * Returns the request body without the id (the edit route has it in the URL).
 * @param {AiProviderRequest} request - Request body.
 * @returns {AiProviderRequest} The body.
 */
const withoutId = (request: AiProviderRequest): AiProviderRequest => {
  const body = { ...request }
  delete body.id
  return body
}

/**
 * Returns the state, the derived view and the actions of the add / edit provider dialog.
 * @param {Params} params - Saved provider (edit) or null (add), context and the callback after a save.
 * @returns {ProviderDialogApi} The dialog API.
 */
export const useProviderDialog = ({ saved, context, onSaved }: Params): ProviderDialogApi => {
  const t = useT()
  const capabilities = useAiCapabilities()
  const { allowlist } = context
  const [state, dispatch, getLatest] = useLatestReducer(providerDialogReducer, () =>
    createInitialState({
      saved,
      test: getInitialLocalTest({
        saved,
        capability: saved ? (capabilities.local[saved.id] ?? null) : null,
        allowlist,
        pageProtocol: window.location.protocol,
      }),
    })
  )
  const view = useMemo(() => getProviderDialogView({ state, saved, allowlist }), [allowlist, saved, state])
  const groups = useMemo(() => getProviderTypeGroups(context), [context])

  /** Fetches the model list of the draft (the same inputs are not asked twice, unless forced). */
  const fetchModels = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      const { draft, models } = getLatest()
      const spec = getProviderTypeSpec(draft.type)
      if (!canListModels({ spec, draft, saved, allowlist })) return
      const inputsKey = [spec.value, draft.baseUrl.trim(), draft.apiKeyVersion].join('|')
      if (!force && inputsKey === models.inputsKey) return
      dispatch({ type: 'modelsRequested', inputsKey })
      // the reducer drops the answer of a request that is no longer the latest
      const { requestId } = getLatest().models
      try {
        const data = await API.aiProviders.fetchProviderModels(buildAccountRequest({ spec, draft, saved }))
        dispatch({ type: 'modelsLoaded', requestId, models: Array.isArray(data?.models) ? data.models : [] })
      } catch (error) {
        dispatch({ type: 'modelsFailed', requestId, message: getApiErrorMessage({ error, t }) })
      }
    },
    [allowlist, dispatch, getLatest, saved, t]
  )

  // an account provider opened for editing lists its models with the saved key
  useEffect(() => {
    if (saved?.kind === 'account') fetchModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on open
  }, [])

  /** Probes the Local server and keeps the result for the current address. */
  const runLocalTest = useCallback(async () => {
    const baseUrl = getLocalDraftUrl(getLatest().draft)
    if (!baseUrl) return
    const probe = await testLocalServer({ baseUrl, modelId: getLatest().draft.model.trim() || null })
    // the address was edited meanwhile: the result belongs to another server
    if (getLocalDraftUrl(getLatest().draft) !== baseUrl) return
    const localView = getLocalServerTestView({ probe, baseUrl, allowlist, pageProtocol: window.location.protocol })
    dispatch({ type: 'localTested', baseUrl, reachable: probe.reachable, models: probe.models, view: localView })
  }, [allowlist, dispatch, getLatest])

  /** Lists the models, then tests the account draft. */
  const runAccountTest = useCallback(async () => {
    // the list first: an empty model is filled before the test; a typed or saved one is kept
    await fetchModels({ force: true })
    const tested = getLatest().draft
    const spec = getProviderTypeSpec(tested.type)
    const result = await testAccountDraft(buildAccountRequest({ spec, draft: tested, saved }))
    dispatch({
      type: 'accountTested',
      test: { key: buildTestKey({ spec, draft: tested }), account: result, local: null },
    })
  }, [dispatch, fetchModels, getLatest, saved])

  /** Runs the test of the current type. */
  const runTest = useCallback(async () => {
    dispatch({ type: 'testStarted' })
    try {
      if (getProviderTypeSpec(getLatest().draft.type).kind === 'local') await runLocalTest()
      else await runAccountTest()
    } finally {
      dispatch({ type: 'testEnded' })
    }
  }, [dispatch, getLatest, runAccountTest, runLocalTest])

  /** Stores the Local server in this browser; false when it could not be saved. */
  const saveLocal = useCallback(async (): Promise<boolean> => {
    const storage = getBrowserStorage()
    const userUuid = getCurrentUserUuid()
    const next = buildLocalProviderSave({
      providers: loadLocalProviders({ storage, userUuid }),
      saved,
      draft: getLatest().draft,
      newId: createLocalProviderId(uuidv4()),
    })
    if (!next || !saveLocalProviders({ storage, userUuid, providers: next.providers })) {
      dispatch({ type: 'saveFailed', message: t('userAiSettings:localServer.notSaved') })
      return false
    }
    if (!saved && shouldBecomeDefault(context)) {
      // the provider is saved: a failed default call leaves Arena default, and "Make default" fixes it
      await API.aiProviders.setDefaultProvider({ providerId: next.provider.id }).catch(() => undefined)
    }
    return true
  }, [context, dispatch, getLatest, saved, t])

  /** Adds or updates the account provider on the server. */
  const saveAccount = useCallback(async () => {
    const { draft } = getLatest()
    const request = buildAccountRequest({ spec: getProviderTypeSpec(draft.type), draft, saved })
    if (saved) await API.aiProviders.updateProvider(saved.id, withoutId(request))
    else await API.aiProviders.addProvider(request)
  }, [getLatest, saved])

  /** Saves the provider, refreshes the settings and closes; errors stay in the dialog. */
  const save = useCallback(async () => {
    dispatch({ type: 'saveStarted' })
    try {
      const { draft, test } = getLatest()
      const spec = getProviderTypeSpec(draft.type)
      // the button is disabled then; this also guards a double click
      if (!canSaveDraft({ spec, draft, saved, test })) return
      if (spec.kind === 'local') {
        if (!(await saveLocal())) return
      } else {
        await saveAccount()
      }
      invalidateAiSettingsCache()
      refreshAiCapabilities().catch(() => undefined)
      onSaved()
    } catch (error) {
      // errors stay in the dialog
      dispatch({ type: 'saveFailed', message: getApiErrorMessage({ error, t }) })
    } finally {
      dispatch({ type: 'saveEnded' })
    }
  }, [dispatch, getLatest, onSaved, saveAccount, saveLocal, saved, t])

  const actions = useMemo<ProviderDialogActions>(
    () => ({
      chooseType: (dialogType) => dispatch({ type: 'typeChosen', dialogType }),
      back: () => dispatch({ type: 'backToTypeStep' }),
      // the address typed for a cloud type is on this computer or network: add it as a Local server instead
      switchToLocalServer: () => dispatch({ type: 'switchedToLocal' }),
      setName: (name) => dispatch({ type: 'nameSet', name }),
      setBaseUrl: (baseUrl) => dispatch({ type: 'baseUrlSet', baseUrl }),
      // the models are listed once the address or the key is left
      commitBaseUrl: () => {
        fetchModels()
      },
      setApiKey: (apiKey) => dispatch({ type: 'apiKeySet', apiKey }),
      commitApiKey: () => {
        fetchModels()
      },
      removeKey: () => dispatch({ type: 'apiKeyRemoved' }),
      keepKey: () => dispatch({ type: 'apiKeyKept' }),
      setModel: (model) => dispatch({ type: 'modelSet', model }),
      selectModel: (value) => dispatch({ type: 'modelSelected', value }),
      runTest,
      save,
    }),
    [dispatch, fetchModels, runTest, save]
  )

  return { state, view, groups, actions }
}
