/**
 * State of the add / edit provider dialog: the step, the draft, the model list, the test and the save.
 * Nothing is stored before "Add provider" / "Save"; then the settings cache and the capabilities are refreshed.
 */
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
import { useI18n } from '@webapp/store/system'

import { getApiErrorMessage, type TFunction, toT } from '../aiSettingsForm'
import {
  type AiModel,
  chooseListedModel,
  OTHER_MODEL_VALUE,
  buildAccountRequest,
  buildLocalProviderSave,
  buildTestKey,
  canListModels,
  canSaveDraft,
  canTestDraft,
  createDraft,
  type DraftTest,
  getInitialLocalTest,
  getLocalDraftUrl,
  getProviderTypeGroups,
  getProviderTypeSpec,
  isApiKeyCleared,
  isApiKeyMissing,
  isOrgServerUrlRefused,
  listLocalModels,
  pickLocalModel,
  type ProviderDialogType,
  type ProviderDraft,
  type ProviderTypeGroup,
  type ProviderTypeSpec,
  type SavedProvider,
  shouldBecomeDefault,
  shouldShowLocalUrlHint,
} from './providerDraft'

export type ProviderDialogContext = {
  allowlist: string[]
  encryptionConfigured: boolean
  mockEnabled: boolean
  defaultProviderId: string
  arenaDefaultReady: boolean
}

export type ProviderDialogStep = 'type' | 'connect'

export type ProviderDialogApi = {
  t: TFunction
  step: ProviderDialogStep
  editing: boolean
  saved: SavedProvider | null
  context: ProviderDialogContext
  spec: ProviderTypeSpec
  draft: ProviderDraft
  groups: ProviderTypeGroup[]
  models: AiModel[]
  modelsFetching: boolean
  modelsError: string | null
  localModels: string[]
  testing: boolean
  // the test of the current values (null after any edit)
  test: DraftTest | null
  keyCleared: boolean
  keyMissing: boolean
  localUrlHint: boolean
  orgServerRefused: boolean
  canTest: boolean
  canSave: boolean
  saving: boolean
  saveError: string | null
  chooseType: (type: ProviderDialogType) => void
  back: () => void
  switchToLocalServer: () => void
  setName: (name: string) => void
  setBaseUrl: (baseUrl: string) => void
  commitBaseUrl: () => void
  setApiKey: (apiKey: string) => void
  commitApiKey: () => void
  setModel: (model: string) => void
  selectModel: (value: string) => void
  runTest: () => Promise<void>
  save: () => Promise<void>
}

type Params = {
  saved: SavedProvider | null
  context: ProviderDialogContext
  onSaved: () => void
}

type DraftUpdate = (prev: ProviderDraft) => ProviderDraft

/**
 * Tests an account draft; a failed request becomes a failed result.
 * @param {AiProviderRequest} request - Request body.
 * @returns {Promise<AiProviderTestResponse>} The result.
 */
const testAccountDraft = async (request: AiProviderRequest): Promise<AiProviderTestResponse> => {
  try {
    return await API.aiProviders.testProvider(request)
  } catch (error: any) {
    const data = error?.response?.data
    return {
      ok: false,
      latencyMs: 0,
      errorMessage: error?.message || 'unknown',
      errorKey: data?.key,
      errorParams: data?.params,
    }
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
 * Keeps the draft in a ref too: the async test and save need the latest values, not the ones of their render.
 * @param {ProviderDraft} initial - First draft.
 * @returns {object} The draft, its ref and the updater.
 */
const useDraftState = (initial: () => ProviderDraft) => {
  const [draft, setDraft] = useState<ProviderDraft>(initial)
  const draftRef = useRef(draft)
  /** Applies a change to the latest draft. */
  const update = useCallback((change: DraftUpdate) => {
    const next = change(draftRef.current)
    draftRef.current = next
    setDraft(next)
  }, [])
  return { draft, draftRef, update }
}

type ModelsParams = {
  spec: ProviderTypeSpec
  saved: SavedProvider | null
  allowlist: string[]
  draftRef: React.MutableRefObject<ProviderDraft>
  update: (change: DraftUpdate) => void
  t: TFunction
}

/**
 * Returns the model list of an account draft (fetched on blur of the address or the key, and before a test).
 * @param {ModelsParams} params - Spec, saved provider, allowlist, draft ref, updater and translation.
 * @returns {object} The list state, fetchModels and resetModels.
 */
const useAccountModels = ({ spec, saved, allowlist, draftRef, update, t }: ModelsParams) => {
  const [models, setModels] = useState<AiModel[]>([])
  const [modelsFetching, setModelsFetching] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const lastKeyRef = useRef<string | null>(null)
  // only the latest request writes its result (a blur fetch must not overwrite the test's)
  const requestIdRef = useRef(0)

  /** Fetches the model list of the draft; returns the model kept, or null. */

  const fetchModels = useCallback(
    async ({ force = false }: { force?: boolean } = {}): Promise<string | null> => {
      const current = draftRef.current
      if (!canListModels({ spec, draft: current, saved, allowlist })) return null
      const key = [spec.value, current.baseUrl.trim(), current.apiKeyVersion].join('|')
      // blur after blur: no new request while the inputs are the same
      if (!force && key === lastKeyRef.current) return null
      lastKeyRef.current = key
      requestIdRef.current += 1
      const requestId = requestIdRef.current
      /** Returns true while no newer list request started. */
      const isCurrent = () => requestId === requestIdRef.current
      setModelsFetching(true)
      setModelsError(null)
      try {
        const data = await API.aiProviders.fetchProviderModels(buildAccountRequest({ spec, draft: current, saved }))
        if (!isCurrent()) return null
        const list = Array.isArray(data?.models) ? data.models : []
        setModels(list)
        if (list.length === 0) return null
        const model = chooseListedModel({ model: draftRef.current.model, models: list })
        update((prev) => ({ ...prev, model, modelFreeText: false }))
        return model
      } catch (error) {
        if (!isCurrent()) return null
        setModels([])
        setModelsError(getApiErrorMessage({ error, t }))
        return null
      } finally {
        if (isCurrent()) setModelsFetching(false)
      }
    },
    [allowlist, draftRef, saved, spec, t, update]
  )

  /** Forgets the list (another type or step). */

  const resetModels = useCallback(() => {
    requestIdRef.current += 1
    lastKeyRef.current = null
    setModels([])
    setModelsError(null)
    setModelsFetching(false)
  }, [])

  return { models, modelsFetching, modelsError, fetchModels, resetModels }
}

/**
 * Returns the state and the actions of the add / edit provider dialog.
 * @param {Params} params - Saved provider (edit) or null (add), context and the callback after a save.
 * @returns {ProviderDialogApi} The dialog API.
 */
export const useProviderDialog = ({ saved, context, onSaved }: Params): ProviderDialogApi => {
  const i18n = useI18n()
  const t = useMemo(() => toT(i18n), [i18n])
  const capabilities = useAiCapabilities()
  const { allowlist } = context
  const [step, setStep] = useState<ProviderDialogStep>(saved ? 'connect' : 'type')
  const { draft, draftRef, update } = useDraftState(() => createDraft({ type: saved?.dialogType ?? 'local', saved }))
  const spec = useMemo(() => getProviderTypeSpec(draft.type), [draft.type])
  const [test, setTest] = useState<DraftTest | null>(() =>
    getInitialLocalTest({
      saved,
      capability: saved ? (capabilities.local[saved.id] ?? null) : null,
      allowlist,
      pageProtocol: window.location.protocol,
    })
  )
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { models, modelsFetching, modelsError, fetchModels, resetModels } = useAccountModels({
    spec,
    saved,
    allowlist,
    draftRef,
    update,
    t,
  })

  // an account provider opened for editing lists its models with the saved key
  useEffect(() => {
    if (saved?.kind === 'account') fetchModels()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on open
  }, [])

  /** Starts a new draft of the type and clears the list, the test and the error. */

  const startDraft = useCallback(
    (type: ProviderDialogType, patch: Partial<ProviderDraft> = {}) => {
      update(() => ({ ...createDraft({ type, saved: null }), ...patch }))
      resetModels()
      setTest(null)
      setSaveError(null)
    },
    [resetModels, update]
  )

  /** Opens step 2 with a new draft of the type. */

  const chooseType = useCallback(
    (type: ProviderDialogType) => {
      startDraft(type)
      setStep('connect')
    },
    [startDraft]
  )

  /** Returns to step 1. */

  const back = useCallback(() => {
    resetModels()
    setTest(null)
    setSaveError(null)
    setStep('type')
  }, [resetModels])

  // the address typed for a cloud type is on this computer or network: add it as a Local server instead
  /** Moves the typed address to a new Local server draft. */
  const switchToLocalServer = useCallback(() => {
    const { baseUrl, name } = draftRef.current
    startDraft('local', { baseUrl, name })
  }, [draftRef, startDraft])

  /** Sets the name. */

  const setName = useCallback((name: string) => update((prev) => ({ ...prev, name })), [update])
  /** Sets the base URL. */
  const setBaseUrl = useCallback((baseUrl: string) => update((prev) => ({ ...prev, baseUrl })), [update])
  /** Sets the key and bumps its edit counter. */
  const setApiKey = useCallback(
    (apiKey: string) => update((prev) => ({ ...prev, apiKey, apiKeyVersion: prev.apiKeyVersion + 1 })),
    [update]
  )
  /** Sets the model. */
  const setModel = useCallback((model: string) => update((prev) => ({ ...prev, model })), [update])
  /** Picks a listed model, or switches to free text for Other. */
  const selectModel = useCallback(
    (value: string) =>
      update((prev) =>
        value === OTHER_MODEL_VALUE ? { ...prev, modelFreeText: true } : { ...prev, model: value, modelFreeText: false }
      ),
    [update]
  )
  /** Lists the models once the address is left. */
  const commitBaseUrl = useCallback(() => {
    fetchModels()
  }, [fetchModels])
  /** Lists the models once the key is left. */
  const commitApiKey = useCallback(() => {
    fetchModels()
  }, [fetchModels])

  /** Probes the Local server and keeps the result for the current address. */

  const runLocalTest = useCallback(async () => {
    const baseUrl = getLocalDraftUrl(draftRef.current)
    if (!baseUrl) return
    const probe = await testLocalServer({ baseUrl, modelId: draftRef.current.model.trim() || null })
    // the address was edited meanwhile: the result belongs to another server
    if (getLocalDraftUrl(draftRef.current) !== baseUrl) return
    const view = getLocalServerTestView({ probe, baseUrl, allowlist, pageProtocol: window.location.protocol })
    update((prev) => ({
      ...prev,
      baseUrl,
      model: pickLocalModel({ reachable: probe.reachable, models: probe.models, model: prev.model }),
    }))
    setTest({
      key: buildTestKey({ spec: getProviderTypeSpec('local'), draft: draftRef.current }),
      account: null,
      local: view,
    })
  }, [allowlist, draftRef, update])

  /** Lists the models, then tests the account draft. */

  const runAccountTest = useCallback(async () => {
    // the list first: a stale model is replaced by a listed one before the test
    await fetchModels({ force: true })
    const tested = draftRef.current
    const result = await testAccountDraft(buildAccountRequest({ spec, draft: tested, saved }))
    setTest({ key: buildTestKey({ spec, draft: tested }), account: result, local: null })
  }, [draftRef, fetchModels, saved, spec])

  /** Runs the test of the current type. */

  const runTest = useCallback(async () => {
    setTesting(true)
    setTest(null)
    setSaveError(null)
    try {
      if (spec.kind === 'local') await runLocalTest()
      else await runAccountTest()
    } finally {
      setTesting(false)
    }
  }, [runAccountTest, runLocalTest, spec.kind])

  /** Stores the Local server in this browser; false when it could not be saved. */

  const saveLocal = useCallback(async (): Promise<boolean> => {
    const storage = getBrowserStorage()
    const userUuid = getCurrentUserUuid()
    const next = buildLocalProviderSave({
      providers: loadLocalProviders({ storage, userUuid }),
      saved,
      draft: draftRef.current,
      newId: createLocalProviderId(uuidv4()),
    })
    if (!next || !saveLocalProviders({ storage, userUuid, providers: next.providers })) {
      setSaveError(t('userAiSettings:localServer.notSaved'))
      return false
    }
    if (!saved && shouldBecomeDefault(context)) {
      // the provider is saved: a failed default call leaves Arena default, and "Make default" fixes it
      await API.aiProviders.setDefaultProvider({ providerId: next.provider.id }).catch(() => undefined)
    }
    return true
  }, [context, draftRef, saved, t])

  /** Adds or updates the account provider on the server. */

  const saveAccount = useCallback(async (): Promise<boolean> => {
    const request = buildAccountRequest({ spec, draft: draftRef.current, saved })
    if (saved) await API.aiProviders.updateProvider(saved.id, withoutId(request))
    else await API.aiProviders.addProvider(request)
    return true
  }, [draftRef, saved, spec])

  /** Saves the provider, refreshes the settings and closes; errors stay in the dialog. */

  const save = useCallback(async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const ok = spec.kind === 'local' ? await saveLocal() : await saveAccount()
      if (!ok) return
      invalidateAiSettingsCache()
      refreshAiCapabilities().catch(() => undefined)
      onSaved()
    } catch (error) {
      // errors stay in the dialog (spec 4.1)
      setSaveError(getApiErrorMessage({ error, t }))
    } finally {
      setSaving(false)
    }
  }, [onSaved, saveAccount, saveLocal, spec.kind, t])

  /** Spec, draft and saved provider, for the key rules. */

  const keyParams = { spec, draft, saved }
  /** The test, only while it matches the current values. */
  const currentTest = test && test.key === buildTestKey({ spec, draft }) ? test : null
  /** Models of the Local server select. */
  const localModels = useMemo(
    () => listLocalModels({ view: currentTest?.local ?? null, model: draft.model }),
    [currentTest, draft.model]
  )

  return {
    t,
    step,
    editing: !!saved,
    saved,
    context,
    spec,
    draft,
    groups: getProviderTypeGroups(context),
    models,
    modelsFetching,
    modelsError,
    localModels,
    testing,
    test: currentTest,
    keyCleared: isApiKeyCleared(keyParams),
    keyMissing: isApiKeyMissing(keyParams),
    localUrlHint: shouldShowLocalUrlHint({ spec, baseUrl: draft.baseUrl, allowlist }),
    orgServerRefused: isOrgServerUrlRefused({ spec, baseUrl: draft.baseUrl, allowlist }),
    canTest: !testing && !saving && canTestDraft({ ...keyParams, allowlist }),
    canSave: !testing && !saving && canSaveDraft({ ...keyParams, test }),
    saving,
    saveError,
    chooseType,
    back,
    switchToLocalServer,
    setName,
    setBaseUrl,
    commitBaseUrl,
    setApiKey,
    commitApiKey,
    setModel,
    selectModel,
    runTest,
    save,
  }
}
