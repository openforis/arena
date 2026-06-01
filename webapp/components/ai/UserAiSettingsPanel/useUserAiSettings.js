import React, { useCallback, useEffect, useMemo, useState } from 'react'

import * as API from '@webapp/service/api'

import { useNotifyInfo, useNotifyError } from '@webapp/components/hooks'
import { invalidateAiSettingsCache } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { useI18n } from '@webapp/store/system'

export const FEATURE_CATEGORIES = ['chat', 'expressions', 'translation', 'analysis']

const defaultFeatureToggles = () => ({ chat: false, expressions: false, translation: false, analysis: false })

export const OTHER_MODEL_VALUE = '__other__'

export const DEFAULT_PROVIDER_VALUE = 'default'

// "default" is a UI-only sentinel meaning "use the admin-configured
// provider". When the user picks it, we save `enabled: false` so the
// backend resolver falls through to the admin default.
export const PROVIDERS = [
  {
    value: DEFAULT_PROVIDER_VALUE,
    isDefault: true,
    requiresBaseUrl: false,
    requiresApiKey: false,
    supportsModelList: false,
  },
  { value: 'openai', requiresBaseUrl: false, requiresApiKey: true, supportsModelList: true },
  { value: 'anthropic', requiresBaseUrl: false, requiresApiKey: true, supportsModelList: true },
  { value: 'google', requiresBaseUrl: false, requiresApiKey: true, supportsModelList: true },
  { value: 'openai-compatible', requiresBaseUrl: true, requiresApiKey: false, supportsModelList: true },
  { value: 'vercel-ai-sdk', requiresBaseUrl: true, requiresApiKey: false, supportsModelList: false },
]

export const BASE_URL_PLACEHOLDERS = {
  'openai-compatible': 'https://openrouter.ai/api/v1',
  'vercel-ai-sdk': 'https://your-app.example.com/api/chat',
}

export const MODEL_PLACEHOLDERS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5',
  google: 'gemini-2.0-flash',
  'openai-compatible': 'llama3.3:70b',
}

const emptyForm = {
  featuresEnabled: false,
  featureToggles: defaultFeatureToggles(),
  provider: DEFAULT_PROVIDER_VALUE,
  model: '',
  baseUrl: '',
  apiKey: '',
  apiKeyDirty: false,
  modelFreeText: false,
}

const buildModelsKey = ({ provider, baseUrl, apiKey, apiKeyDirty, hasSavedApiKey }) =>
  [provider, baseUrl || '', apiKeyDirty ? `dirty:${apiKey || ''}` : `saved:${hasSavedApiKey ? '1' : '0'}`].join('|')

/**
 * Encapsulates all state and logic for the UserAiSettingsPanel component.
 * @returns {object} State values, handlers, and derived UI elements for the panel.
 */
export const useUserAiSettings = () => {
  const i18n = useI18n()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()

  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const [models, setModels] = useState([])
  const [modelsFetching, setModelsFetching] = useState(false)
  const [modelsError, setModelsError] = useState(null)
  const [lastModelsKey, setLastModelsKey] = useState(null)

  const providerSpec = useMemo(() => PROVIDERS.find((p) => p.value === form.provider) || PROVIDERS[0], [form.provider])

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await API.aiSettings.fetchSettings()
      setSettings(data)
      setForm({
        featuresEnabled: !!data.featuresEnabled,
        featureToggles: { ...defaultFeatureToggles(), ...data.featureToggles },
        // When the user has an active override (`enabled`), show their
        // provider; otherwise show "Default" (= admin-configured).
        provider: data.enabled && data.provider ? data.provider : DEFAULT_PROVIDER_VALUE,
        model: data.model || '',
        baseUrl: data.baseUrl || '',
        apiKey: '',
        apiKeyDirty: false,
        modelFreeText: false,
      })
      setModels([])
      setModelsError(null)
      setLastModelsKey(null)
    } catch (error) {
      const code = error?.response?.data?.error
      if (code === 'aiFeaturesDisabled' || error?.response?.status === 404) {
        setSettings({ aiFeaturesDisabled: true })
      } else {
        notifyError({ key: 'common.fetchError', params: { message: error?.message || 'unknown' } })
      }
    } finally {
      setLoading(false)
    }
  }, [notifyError])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const onProviderChange = useCallback((providerItem) => {
    const provider = providerItem?.value
    if (!provider) return
    setForm((prev) => ({ ...prev, provider, baseUrl: '', model: '', modelFreeText: false }))
    setModels([])
    setModelsError(null)
    setLastModelsKey(null)
  }, [])
  const onModelChange = useCallback((value) => setForm((prev) => ({ ...prev, model: value })), [])
  const onBaseUrlChange = useCallback((value) => setForm((prev) => ({ ...prev, baseUrl: value })), [])
  const onApiKeyChange = useCallback((value) => setForm((prev) => ({ ...prev, apiKey: value, apiKeyDirty: true })), [])
  const onFeaturesEnabledChange = useCallback(
    (checked) => setForm((prev) => ({ ...prev, featuresEnabled: checked })),
    []
  )
  const onFeatureToggleChange = useCallback(
    (category) => (checked) =>
      setForm((prev) => ({
        ...prev,
        featureToggles: { ...prev.featureToggles, [category]: checked },
      })),
    []
  )

  const onModelSelectChange = useCallback((e) => {
    const value = e.target.value
    if (value === OTHER_MODEL_VALUE) {
      setForm((prev) => ({ ...prev, modelFreeText: true }))
    } else {
      setForm((prev) => ({ ...prev, model: value, modelFreeText: false }))
    }
  }, [])

  /**
   * Fetch the model list when we have enough credentials. Called on blur of
   * Base URL / API key (and from the explicit "Fetch models" button). Skips
   * the call when the key inputs haven't changed since the last attempt.
   * @param {object} [opts] - Options.
   * @param {boolean} [opts.force] - Bypass the dedupe key check.
   * @returns {Promise<void>} Nothing.
   */
  const fetchModels = useCallback(
    async ({ force = false } = {}) => {
      if (!providerSpec.supportsModelList) return
      const hasBaseUrl = !providerSpec.requiresBaseUrl || form.baseUrl.trim().length > 0
      const hasApiKey = !providerSpec.requiresApiKey || form.apiKeyDirty || !!settings?.hasApiKey
      if (!hasBaseUrl || !hasApiKey) return

      const key = buildModelsKey({
        provider: form.provider,
        baseUrl: form.baseUrl,
        apiKey: form.apiKey,
        apiKeyDirty: form.apiKeyDirty,
        hasSavedApiKey: !!settings?.hasApiKey,
      })
      if (!force && key === lastModelsKey) return

      setModelsFetching(true)
      setModelsError(null)
      setLastModelsKey(key)
      try {
        const data = await API.aiSettings.fetchModels({
          provider: form.provider,
          baseUrl: providerSpec.requiresBaseUrl ? form.baseUrl : null,
          apiKey: form.apiKeyDirty ? form.apiKey : null,
        })
        const list = Array.isArray(data?.models) ? data.models : []
        setModels(list)
        if (list.length > 0) {
          // Show the dropdown after fetching. If the current model isn't in
          // the list (empty, stale, or a hand-typed id), preselect the first
          // returned model so the user immediately sees the available choices;
          // they can still pick "Other (type a model id)…" to free-text.
          const currentInList = !!form.model && list.some((m) => m.id === form.model)
          if (currentInList) {
            setForm((prev) => ({ ...prev, modelFreeText: false }))
          } else {
            setForm((prev) => ({ ...prev, model: list[0].id, modelFreeText: false }))
          }
        }
      } catch (error) {
        setModels([])
        setModelsError(error?.response?.data?.error || error?.message || 'unknown')
      } finally {
        setModelsFetching(false)
      }
    },
    [
      providerSpec.supportsModelList,
      providerSpec.requiresBaseUrl,
      providerSpec.requiresApiKey,
      form.baseUrl,
      form.apiKeyDirty,
      form.provider,
      form.apiKey,
      form.model,
      settings?.hasApiKey,
      lastModelsKey,
    ]
  )

  const onBaseUrlBlur = useCallback(() => fetchModels(), [fetchModels])
  const onApiKeyBlur = useCallback(() => fetchModels(), [fetchModels])

  const onSave = useCallback(async () => {
    setSaving(true)
    setTestResult(null)
    try {
      const useAdminDefault = providerSpec.isDefault
      const update = {
        featuresEnabled: form.featuresEnabled,
        featureToggles: form.featureToggles,
        enabled: !useAdminDefault,
      }
      if (!useAdminDefault) {
        update.provider = form.provider
        update.model = providerSpec.supportsModelList ? form.model : null
        update.baseUrl = providerSpec.requiresBaseUrl ? form.baseUrl : null
        if (form.apiKeyDirty) update.apiKey = form.apiKey
      }
      const data = await API.aiSettings.saveSettings(update)
      setSettings(data)
      setForm((prev) => ({ ...prev, apiKey: '', apiKeyDirty: false }))
      invalidateAiSettingsCache()
      notifyInfo({ key: 'userAiSettings:savedSuccessfully' })
    } catch (error) {
      notifyError({ key: 'userAiSettings:saveFailed', params: { message: error?.message || 'unknown' } })
    } finally {
      setSaving(false)
    }
  }, [
    providerSpec.isDefault,
    providerSpec.supportsModelList,
    providerSpec.requiresBaseUrl,
    form.featuresEnabled,
    form.featureToggles,
    form.provider,
    form.model,
    form.baseUrl,
    form.apiKeyDirty,
    form.apiKey,
    notifyInfo,
    notifyError,
  ])

  const onTest = useCallback(async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const draft = providerSpec.isDefault
        ? {}
        : {
            provider: form.provider,
            model: providerSpec.supportsModelList ? form.model : undefined,
            baseUrl: providerSpec.requiresBaseUrl ? form.baseUrl : undefined,
            apiKey: form.apiKeyDirty ? form.apiKey : undefined,
          }
      const result = await API.aiSettings.testConnection(draft)
      setTestResult(result)
    } catch (error) {
      setTestResult({ ok: false, errorMessage: error?.message || 'unknown' })
    } finally {
      setTesting(false)
    }
  }, [form.apiKey, form.apiKeyDirty, form.baseUrl, form.model, form.provider, providerSpec])

  const onClear = useCallback(async () => {
    setSaving(true)
    setTestResult(null)
    try {
      const data = await API.aiSettings.clearSettings()
      setSettings(data)
      setForm({ ...emptyForm, featureToggles: defaultFeatureToggles() })
      setModels([])
      setModelsError(null)
      setLastModelsKey(null)
      invalidateAiSettingsCache()
      notifyInfo({ key: 'userAiSettings:cleared' })
    } catch (error) {
      notifyError({ key: 'userAiSettings:saveFailed', params: { message: error?.message || 'unknown' } })
    } finally {
      setSaving(false)
    }
  }, [notifyError, notifyInfo])

  const testResultView = useMemo(() => {
    if (testing) {
      return <div className="user-ai-settings-panel__test">{i18n.t('userAiSettings:testing')}</div>
    }
    if (testResult) {
      const testResultMessage = testResult.ok
        ? i18n.t('userAiSettings:testOk', { latencyMs: testResult.latencyMs })
        : i18n.t('userAiSettings:testFailed', { message: testResult.errorMessage || 'unknown' })
      return <div className={`user-ai-settings-panel__test ${testResult.ok ? 'ok' : 'fail'}`}>{testResultMessage}</div>
    }
    return null
  }, [i18n, testResult, testing])

  return {
    i18n,
    loading,
    settings,
    form,
    saving,
    testing,
    models,
    modelsFetching,
    modelsError,
    providerSpec,
    onProviderChange,
    onModelChange,
    onBaseUrlChange,
    onApiKeyChange,
    onFeaturesEnabledChange,
    onFeatureToggleChange,
    onModelSelectChange,
    fetchModels,
    onBaseUrlBlur,
    onApiKeyBlur,
    onSave,
    onTest,
    onClear,
    testResultView,
  }
}
