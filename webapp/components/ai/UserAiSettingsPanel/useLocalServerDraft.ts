/**
 * State of the Local AI server block: a draft of the browser settings, written by the profile Save.
 */
import { useCallback, useMemo, useRef, useState } from 'react'

import { getCurrentUserUuid, loadAiCapabilities, testLocalServer } from '@webapp/ai/engines/capabilitiesStore'
import { getBrowserStorage, loadLocalServerSettings } from '@webapp/ai/engines/localServerSettings'
import type { LocalServerProbeResult } from '@webapp/ai/engines/localServerProbe'
import { getLocalServerTestView, type LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import type { AiLocalServerSettings } from '@webapp/ai/engines/types'
import { useAiCapabilities } from '@webapp/components/ai/hooks/useAiCapabilities'

import {
  acceptLocalTestResult,
  commitLocalBaseUrl,
  getCurrentLocalTestView,
  isLocalDraftChanged,
  listLocalModels,
  type LocalSessionTest,
  normalizeLocalBaseUrl,
  pickProbedModel,
  saveLocalDraft,
} from './localServerDraft'

export type LocalServerDraftApi = {
  draft: AiLocalServerSettings
  dirty: boolean
  testing: boolean
  testView: LocalServerTestView | null
  models: string[]
  // incremented to ask the block to scroll into view and focus Server URL
  focusRequest: number
  setEnabled: (enabled: boolean) => void
  setBaseUrl: (baseUrl: string) => void
  commitBaseUrl: () => void
  setModelId: (modelId: string | null) => void
  setPreferLocal: (preferLocal: boolean) => void
  runTest: () => Promise<void>
  save: () => boolean
  enableAndFocus: () => void
}

type DraftUpdate = (prev: AiLocalServerSettings) => AiLocalServerSettings

/**
 * Reads the settings saved in this browser for the logged-in user.
 * @returns {AiLocalServerSettings} The settings (the defaults when none or unreadable).
 */
const loadSaved = (): AiLocalServerSettings =>
  loadLocalServerSettings({ storage: getBrowserStorage(), userUuid: getCurrentUserUuid() })

/**
 * Probes the tested settings and builds the result view.
 * @param {AiLocalServerSettings} tested - Settings to test (normalized URL).
 * @returns {Promise<{probe: LocalServerProbeResult, view: LocalServerTestView}>} The probe and its view.
 */
const probeDraft = async (
  tested: AiLocalServerSettings
): Promise<{ probe: LocalServerProbeResult; view: LocalServerTestView }> => {
  // the allowlist comes with the capabilities: classify with the loaded one, never the empty snapshot's
  const [probe, loaded] = await Promise.all([
    testLocalServer({ baseUrl: tested.baseUrl, modelId: tested.modelId }),
    loadAiCapabilities(),
  ])
  const view = getLocalServerTestView({
    probe,
    baseUrl: tested.baseUrl,
    allowlist: loaded.instance.orgHostedBaseUrls,
    pageProtocol: window.location.protocol,
  })
  return { probe, view }
}

/**
 * Returns the draft of the local server settings and its actions; nothing is written before save().
 * @returns {LocalServerDraftApi} The draft API.
 */
export const useLocalServerDraft = (): LocalServerDraftApi => {
  const capabilities = useAiCapabilities()
  const [saved, setSaved] = useState<AiLocalServerSettings>(loadSaved)
  const [draft, setDraft] = useState<AiLocalServerSettings>(loadSaved)
  const [sessionTest, setSessionTest] = useState<LocalSessionTest | null>(null)
  const [testing, setTesting] = useState(false)
  const [focusRequest, setFocusRequest] = useState(0)
  // the async Test and Save must see the latest values, not the ones of their render
  const draftRef = useRef(draft)
  const savedRef = useRef(saved)
  // the server the chosen model belongs to
  const committedBaseUrlRef = useRef(draft.baseUrl)

  const updateDraft = useCallback((update: DraftUpdate) => {
    const next = update(draftRef.current)
    draftRef.current = next
    setDraft(next)
  }, [])

  const setEnabled = useCallback((enabled: boolean) => updateDraft((prev) => ({ ...prev, enabled })), [updateDraft])
  const setBaseUrl = useCallback((baseUrl: string) => updateDraft((prev) => ({ ...prev, baseUrl })), [updateDraft])
  const setModelId = useCallback(
    (modelId: string | null) => updateDraft((prev) => ({ ...prev, modelId })),
    [updateDraft]
  )
  const setPreferLocal = useCallback(
    (preferLocal: boolean) => updateDraft((prev) => ({ ...prev, preferLocal })),
    [updateDraft]
  )

  const commitBaseUrl = useCallback(() => {
    updateDraft((prev) => commitLocalBaseUrl({ draft: prev, committedBaseUrl: committedBaseUrlRef.current }))
    committedBaseUrlRef.current = draftRef.current.baseUrl
  }, [updateDraft])

  const runTest = useCallback(async () => {
    const tested = { ...draftRef.current, baseUrl: normalizeLocalBaseUrl(draftRef.current.baseUrl) }
    const testedUserUuid = getCurrentUserUuid()
    setTesting(true)
    try {
      const { probe, view } = await probeDraft(tested)
      const accepted = acceptLocalTestResult({
        testedUserUuid,
        currentUserUuid: getCurrentUserUuid(),
        testedBaseUrl: tested.baseUrl,
        currentBaseUrl: draftRef.current.baseUrl,
      })
      // the URL was edited or the user changed meanwhile: the result belongs to another server
      if (!accepted) return
      setSessionTest({ baseUrl: tested.baseUrl, view })
      // a model picked here changes the draft, so the panel becomes dirty
      updateDraft((prev) => ({
        ...prev,
        baseUrl: tested.baseUrl,
        modelId: pickProbedModel({ reachable: probe.reachable, models: probe.models, modelId: prev.modelId }),
      }))
      committedBaseUrlRef.current = tested.baseUrl
    } finally {
      setTesting(false)
    }
  }, [updateDraft])

  const save = useCallback((): boolean => {
    const result = saveLocalDraft({
      storage: getBrowserStorage(),
      userUuid: getCurrentUserUuid(),
      draft: draftRef.current,
      saved: savedRef.current,
    })
    savedRef.current = result.saved
    setSaved(result.saved)
    // show the stored (normalized) values; a refused write keeps the draft, so the panel stays dirty
    if (result.ok) updateDraft(() => result.saved)
    return result.ok
  }, [updateDraft])

  const enableAndFocus = useCallback(() => {
    setEnabled(true)
    setFocusRequest((count) => count + 1)
  }, [setEnabled])

  const testView = useMemo(
    () =>
      getCurrentLocalTestView({
        draft,
        sessionTest,
        capability: capabilities.localServer,
        allowlist: capabilities.instance.orgHostedBaseUrls,
        pageProtocol: window.location.protocol,
      }),
    [capabilities.instance.orgHostedBaseUrls, capabilities.localServer, draft, sessionTest]
  )
  const models = useMemo(() => listLocalModels({ testView, modelId: draft.modelId }), [draft.modelId, testView])
  const dirty = useMemo(() => isLocalDraftChanged({ draft, saved }), [draft, saved])

  return {
    draft,
    dirty,
    testing,
    testView,
    models,
    focusRequest,
    setEnabled,
    setBaseUrl,
    commitBaseUrl,
    setModelId,
    setPreferLocal,
    runTest,
    save,
    enableAndFocus,
  }
}
