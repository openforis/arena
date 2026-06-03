import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { AiProvider } from '@common/ai/aiProvider'

import * as API from '@webapp/service/api'

import { useNotifyInfo, useNotifyError } from '@webapp/components/hooks'
import { invalidateAiSettingsCache } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { useI18n } from '@webapp/store/system'

export type FeatureCategory = 'chat' | 'expressions' | 'translation' | 'dataDictionary' | 'userActivity'

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  'chat',
  'expressions',
  'translation',
  'dataDictionary',
  'userActivity',
]

type FeatureToggles = Record<FeatureCategory, boolean>

const defaultFeatureToggles = (): FeatureToggles => ({
  chat: false,
  expressions: false,
  translation: false,
  dataDictionary: false,
  userActivity: false,
})

export const OTHER_MODEL_VALUE = '__other__'

export const DEFAULT_PROVIDER_VALUE = 'default'

// "default" is a UI-only sentinel meaning "use the admin-configured
// provider". When the user picks it, we save `enabled: false` so the
// backend resolver falls through to the admin default.
export type ProviderSpec = {
  value: string
  isDefault?: boolean
  requiresBaseUrl: boolean
  requiresApiKey: boolean
  supportsModelList: boolean
}

export const PROVIDERS: ProviderSpec[] = [
  {
    value: DEFAULT_PROVIDER_VALUE,
    isDefault: true,
    requiresBaseUrl: false,
    requiresApiKey: false,
    supportsModelList: false,
  },
  { value: AiProvider.openai, requiresBaseUrl: false, requiresApiKey: true, supportsModelList: true },
  { value: AiProvider.anthropic, requiresBaseUrl: false, requiresApiKey: true, supportsModelList: true },
  { value: AiProvider.google, requiresBaseUrl: false, requiresApiKey: true, supportsModelList: true },
  { value: AiProvider.openaiCompatible, requiresBaseUrl: true, requiresApiKey: false, supportsModelList: true },
  { value: AiProvider.vercelAiSdk, requiresBaseUrl: true, requiresApiKey: false, supportsModelList: false },
]

export const BASE_URL_PLACEHOLDERS: Record<string, string> = {
  [AiProvider.openaiCompatible]: 'https://openrouter.ai/api/v1',
  [AiProvider.vercelAiSdk]: 'https://your-app.example.com/api/chat',
}

export const MODEL_PLACEHOLDERS: Record<string, string> = {
  [AiProvider.openai]: 'gpt-4o-mini',
  [AiProvider.anthropic]: 'claude-haiku-4-5',
  [AiProvider.google]: 'gemini-2.0-flash',
  [AiProvider.openaiCompatible]: 'llama3.3:70b',
}

type AiSettings = {
  featuresEnabled?: boolean
  featureToggles?: Partial<FeatureToggles>
  enabled?: boolean
  provider?: string
  model?: string
  baseUrl?: string
  hasApiKey?: boolean
  aiFeaturesDisabled?: boolean
  effectiveSource?: string
  effectiveProvider?: string
  effectiveModel?: string
  encryptionConfigured?: boolean
}

type AiModel = {
  id: string
  description?: string
}

type TestResult = {
  ok: boolean
  latencyMs?: number
  errorMessage?: string
}

type SettingsUpdate = {
  featuresEnabled: boolean
  featureToggles: FeatureToggles
  enabled: boolean
  provider?: string
  model?: string | null
  baseUrl?: string | null
  apiKey?: string
}

type FormState = {
  featuresEnabled: boolean
  featureToggles: FeatureToggles
  provider: string
  model: string
  baseUrl: string
  apiKey: string
  apiKeyDirty: boolean
  apiKeyVersion: number
  modelFreeText: boolean
}

const emptyForm: FormState = {
  featuresEnabled: false,
  featureToggles: defaultFeatureToggles(),
  provider: DEFAULT_PROVIDER_VALUE,
  model: '',
  baseUrl: '',
  apiKey: '',
  apiKeyDirty: false,
  apiKeyVersion: 0,
  modelFreeText: false,
}

const buildModelsKey = ({
  provider,
  baseUrl,
  apiKeyDirty,
  apiKeyVersion,
  hasSavedApiKey,
}: {
  provider: string
  baseUrl: string
  apiKeyDirty: boolean
  apiKeyVersion: number
  hasSavedApiKey: boolean
}): string => {
  const savedKeyFlag = hasSavedApiKey ? '1' : '0'
  const apiKeySegment = apiKeyDirty ? `dirty:v${apiKeyVersion}` : `saved:${savedKeyFlag}`
  return [provider, baseUrl || '', apiKeySegment].join('|')
}

type UseUserAiSettingsResult = {
  i18n: ReturnType<typeof useI18n>
  loading: boolean
  settings: AiSettings | null
  form: FormState
  dirty: boolean
  saving: boolean
  testing: boolean
  models: AiModel[]
  modelsFetching: boolean
  modelsError: string | null
  providerSpec: ProviderSpec
  onProviderChange: (providerItem: ProviderSpec | null) => void
  onModelChange: (value: string) => void
  onBaseUrlChange: (value: string) => void
  onApiKeyChange: (value: string) => void
  onFeaturesEnabledChange: (checked: boolean) => void
  onFeatureToggleChange: (category: FeatureCategory) => (checked: boolean) => void
  onModelSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  fetchModels: (opts?: { force?: boolean }) => Promise<void>
  onBaseUrlBlur: () => void
  onApiKeyBlur: () => void
  onSave: () => Promise<void>
  onTest: () => Promise<void>
  onClear: () => Promise<void>
  testResultView: React.ReactElement | null
}

/**
 * Encapsulates all state and logic for the UserAiSettingsPanel component.
 */
export const useUserAiSettings = (): UseUserAiSettingsResult => {
  const i18n = useI18n()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()

  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<AiSettings | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  const [models, setModels] = useState<AiModel[]>([])
  const [modelsFetching, setModelsFetching] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [lastModelsKey, setLastModelsKey] = useState<string | null>(null)

  const providerSpec = useMemo(
    (): ProviderSpec => PROVIDERS.find((p) => p.value === form.provider) ?? PROVIDERS[0],
    [form.provider]
  )

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data: AiSettings = await API.aiSettings.fetchSettings()
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
        apiKeyVersion: 0,
        modelFreeText: false,
      })
      setModels([])
      setModelsError(null)
      setLastModelsKey(null)
      setDirty(false)
    } catch (error: any) {
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

  const onProviderChange = useCallback((providerItem: ProviderSpec | null) => {
    const provider = providerItem?.value
    if (!provider) return
    setForm((prev) => ({ ...prev, provider, baseUrl: '', model: '', modelFreeText: false }))
    setModels([])
    setModelsError(null)
    setLastModelsKey(null)
    setDirty(true)
  }, [])

  const onModelChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, model: value }))
    setDirty(true)
  }, [])
  const onBaseUrlChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, baseUrl: value }))
    setDirty(true)
  }, [])
  const onApiKeyChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, apiKey: value, apiKeyDirty: true, apiKeyVersion: prev.apiKeyVersion + 1 }))
    setDirty(true)
  }, [])
  const onFeaturesEnabledChange = useCallback((checked: boolean) => {
    setForm((prev) => ({ ...prev, featuresEnabled: checked }))
    setDirty(true)
  }, [])
  const onFeatureToggleChange = useCallback(
    (category: FeatureCategory) => (checked: boolean) => {
      setForm((prev) => ({
        ...prev,
        featureToggles: { ...prev.featureToggles, [category]: checked },
      }))
      setDirty(true)
    },
    []
  )

  const onModelSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === OTHER_MODEL_VALUE) {
      setForm((prev) => ({ ...prev, modelFreeText: true }))
    } else {
      setForm((prev) => ({ ...prev, model: value, modelFreeText: false }))
    }
    setDirty(true)
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
    async ({ force = false }: { force?: boolean } = {}) => {
      if (!providerSpec.supportsModelList) return
      const hasBaseUrl = !providerSpec.requiresBaseUrl || form.baseUrl.trim().length > 0
      const hasApiKey = !providerSpec.requiresApiKey || form.apiKeyDirty || !!settings?.hasApiKey
      if (!hasBaseUrl || !hasApiKey) return

      const key = buildModelsKey({
        provider: form.provider,
        baseUrl: form.baseUrl,
        apiKeyDirty: form.apiKeyDirty,
        apiKeyVersion: form.apiKeyVersion,
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
        const list: AiModel[] = Array.isArray(data?.models) ? data.models : []
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
      } catch (error: any) {
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
      form.apiKeyVersion,
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
      const update: SettingsUpdate = {
        featuresEnabled: form.featuresEnabled,
        featureToggles: form.featureToggles,
        enabled: !useAdminDefault,
        ...(useAdminDefault
          ? {}
          : {
              provider: form.provider,
              model: providerSpec.supportsModelList ? form.model : null,
              baseUrl: providerSpec.requiresBaseUrl ? form.baseUrl : null,
              ...(form.apiKeyDirty ? { apiKey: form.apiKey } : {}),
            }),
      }
      const data: AiSettings = await API.aiSettings.saveSettings(update as any)
      setSettings(data)
      setForm((prev) => ({ ...prev, apiKey: '', apiKeyDirty: false }))
      setDirty(false)
      invalidateAiSettingsCache()
      notifyInfo({ key: 'userAiSettings:savedSuccessfully' })
    } catch (error: any) {
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
      const result: TestResult = await API.aiSettings.testConnection(draft)
      setTestResult(result)
    } catch (error: any) {
      setTestResult({ ok: false, errorMessage: error?.message || 'unknown' })
    } finally {
      setTesting(false)
    }
  }, [form.apiKey, form.apiKeyDirty, form.baseUrl, form.model, form.provider, providerSpec])

  const onClear = useCallback(async () => {
    setSaving(true)
    setTestResult(null)
    try {
      const data: AiSettings = await API.aiSettings.clearSettings()
      setSettings(data)
      setForm({ ...emptyForm, featureToggles: defaultFeatureToggles() })
      setModels([])
      setModelsError(null)
      setLastModelsKey(null)
      setDirty(false)
      invalidateAiSettingsCache()
      notifyInfo({ key: 'userAiSettings:cleared' })
    } catch (error: any) {
      notifyError({ key: 'userAiSettings:saveFailed', params: { message: error?.message || 'unknown' } })
    } finally {
      setSaving(false)
    }
  }, [notifyError, notifyInfo])

  const testResultView = useMemo((): React.ReactElement | null => {
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
    dirty,
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
