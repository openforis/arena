/**
 * Model list and Test of the cloud provider block. The provider fields themselves live in the panel form.
 */
import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import * as API from '@webapp/service/api'

import {
  type AiModel,
  type AiSettings,
  buildCloudTestKey,
  buildModelsKey,
  buildTestDraft,
  canListModels,
  chooseListedModel,
  type CloudTestState,
  type FormState,
  getApiErrorMessage,
  getCurrentCloudTestResult,
  type ProviderSpec,
  type TestResult,
  toT,
} from './aiSettingsForm'

export type CloudProviderApi = {
  models: AiModel[]
  modelsFetching: boolean
  modelsError: string | null
  testing: boolean
  // the Test result of the current draft (null after any edit)
  testResult: TestResult | null
  fetchModels: (options?: { force?: boolean }) => Promise<string | null>
  runTest: () => Promise<void>
  resetModels: () => void
}

type Params = {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  spec: ProviderSpec
  settings: AiSettings | null
  allowlist: string[]
  markDirty: () => void
  i18n: { t: (key: any, params?: any) => unknown }
}

/**
 * Requests the models of the draft provider.
 * @param {object} params - Parameters.
 * @param {FormState} params.form - Form.
 * @param {ProviderSpec} params.spec - Provider spec.
 * @returns {Promise<AiModel[]>} The models.
 */
const requestModels = async ({ form, spec }: { form: FormState; spec: ProviderSpec }): Promise<AiModel[]> => {
  const data = await API.aiSettings.fetchModels({
    provider: form.provider,
    baseUrl: spec.requiresBaseUrl ? form.baseUrl : null,
    apiKey: form.apiKeyDirty ? form.apiKey : null,
  })
  return Array.isArray(data?.models) ? data.models : []
}

/**
 * Tests a draft; a failed request becomes a failed result.
 * @param {object} draft - Body of POST /api/ai/settings/test.
 * @returns {Promise<TestResult>} The result.
 */
const testCloudDraft = async (draft: object): Promise<TestResult> => {
  try {
    return await API.aiSettings.testConnection(draft)
  } catch (error: any) {
    const data = error?.response?.data
    return { ok: false, errorMessage: error?.message || 'unknown', errorKey: data?.key, errorParams: data?.params }
  }
}

/**
 * Returns the model list and the Test of the cloud provider draft.
 * @param {Params} params - Form state, provider spec, loaded settings, allowlist, dirty marker and i18n.
 * @returns {CloudProviderApi} The API.
 */
export const useCloudProvider = ({
  form,
  setForm,
  spec,
  settings,
  allowlist,
  markDirty,
  i18n,
}: Params): CloudProviderApi => {
  const t = useMemo(() => toT(i18n), [i18n])
  const [models, setModels] = useState<AiModel[]>([])
  const [modelsFetching, setModelsFetching] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [test, setTest] = useState<CloudTestState | null>(null)
  // Test awaits the list, then needs the form as it is then
  const formRef = useRef(form)
  const lastModelsKeyRef = useRef<string | null>(null)

  useEffect(() => {
    formRef.current = form
  }, [form])

  const fetchModels = useCallback(
    async ({ force = false }: { force?: boolean } = {}): Promise<string | null> => {
      const current = formRef.current
      if (!canListModels({ spec, form: current, settings, allowlist })) return null
      const key = buildModelsKey({
        provider: current.provider,
        baseUrl: current.baseUrl,
        apiKeyDirty: current.apiKeyDirty,
        apiKeyVersion: current.apiKeyVersion,
        hasSavedApiKey: !!settings?.hasApiKey,
      })
      // blur after blur: no new request while the inputs are the same
      if (!force && key === lastModelsKeyRef.current) return null
      lastModelsKeyRef.current = key
      setModelsFetching(true)
      setModelsError(null)
      try {
        const list = await requestModels({ form: current, spec })
        setModels(list)
        if (list.length === 0) return null
        const model = chooseListedModel({ model: current.model, models: list })
        setForm((prev) => ({ ...prev, model, modelFreeText: false }))
        // a stale model replaced by a listed one is an edit to save
        if (model !== current.model) markDirty()
        return model
      } catch (error) {
        setModels([])
        setModelsError(getApiErrorMessage({ error, t }))
        return null
      } finally {
        setModelsFetching(false)
      }
    },
    [allowlist, markDirty, setForm, settings, spec, t]
  )

  const runTest = useCallback(async () => {
    setTesting(true)
    setTest(null)
    try {
      const model = await fetchModels({ force: true })
      const tested = model ? { ...formRef.current, model } : formRef.current
      const result = await testCloudDraft(buildTestDraft({ form: tested, spec }))
      setTest({ key: buildCloudTestKey(tested), result })
    } finally {
      setTesting(false)
    }
  }, [fetchModels, spec])

  const resetModels = useCallback(() => {
    setModels([])
    setModelsError(null)
    lastModelsKeyRef.current = null
  }, [])

  const testResult = useMemo(() => getCurrentCloudTestResult({ test, form }), [form, test])

  return { models, modelsFetching, modelsError, testing, testResult, fetchModels, runTest, resetModels }
}
