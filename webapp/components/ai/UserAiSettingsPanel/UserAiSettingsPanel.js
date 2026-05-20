import './UserAiSettingsPanel.scss'

import React, { useEffect, useMemo, useState } from 'react'

import * as API from '@webapp/service/api'

import { Button } from '@webapp/components/buttons'
import { FormItem, Input } from '@webapp/components/form/Input'
import { useNotifyInfo, useNotifyError } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'
import { invalidateAiSettingsCache } from '@webapp/components/ai/hooks/useAiFeatureEnabled'

const FEATURE_CATEGORIES = ['chat', 'expressions', 'translation', 'analysis']

const defaultFeatureToggles = () => ({ chat: false, expressions: false, translation: false, analysis: false })

const OTHER_MODEL_VALUE = '__other__'

const DEFAULT_PROVIDER_VALUE = 'default'

// "default" is a UI-only sentinel meaning "use the admin-configured
// provider". When the user picks it, we save `enabled: false` so the
// backend resolver falls through to the admin default.
const PROVIDERS = [
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

const BASE_URL_PLACEHOLDERS = {
  'openai-compatible': 'https://openrouter.ai/api/v1',
  'vercel-ai-sdk': 'https://your-app.example.com/api/chat',
}

const MODEL_PLACEHOLDERS = {
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
 * Embeddable panel that lets the logged-in user configure their personal
 * LLM provider. Designed to be dropped inline on the User Edit page next
 * to the Map API Keys fieldset.
 * @returns {React.Element} Panel.
 */
const UserAiSettingsPanel = () => {
  const i18n = useI18n()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()

  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const [models, setModels] = useState([])
  const [modelsFetching, setModelsFetching] = useState(false)
  const [modelsError, setModelsError] = useState(null)
  const [lastModelsKey, setLastModelsKey] = useState(null)

  const providerSpec = useMemo(() => PROVIDERS.find((p) => p.value === form.provider) || PROVIDERS[0], [form.provider])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const data = await API.aiSettings.fetchSettings()
      setSettings(data)
      setForm({
        featuresEnabled: !!data.featuresEnabled,
        featureToggles: { ...defaultFeatureToggles(), ...(data.featureToggles || {}) },
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
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const onProviderChange = (e) => {
    const provider = e.target.value
    setForm((prev) => ({ ...prev, provider, baseUrl: '', model: '', modelFreeText: false }))
    setModels([])
    setModelsError(null)
    setLastModelsKey(null)
  }
  const onModelChange = (value) => setForm((prev) => ({ ...prev, model: value }))
  const onBaseUrlChange = (value) => setForm((prev) => ({ ...prev, baseUrl: value }))
  const onApiKeyChange = (value) => setForm((prev) => ({ ...prev, apiKey: value, apiKeyDirty: true }))
  const onFeaturesEnabledChange = (e) => setForm((prev) => ({ ...prev, featuresEnabled: e.target.checked }))
  const onFeatureToggleChange = (category) => (e) =>
    setForm((prev) => ({
      ...prev,
      featureToggles: { ...prev.featureToggles, [category]: e.target.checked },
    }))

  const onModelSelectChange = (e) => {
    const value = e.target.value
    if (value === OTHER_MODEL_VALUE) {
      setForm((prev) => ({ ...prev, modelFreeText: true }))
    } else {
      setForm((prev) => ({ ...prev, model: value, modelFreeText: false }))
    }
  }

  /**
   * Fetch the model list when we have enough credentials. Called on blur of
   * Base URL / API key (and from the explicit "Fetch models" button). Skips
   * the call when the key inputs haven't changed since the last attempt.
   * @param {object} [opts] - Options.
   * @param {boolean} [opts.force] - Bypass the dedupe key check.
   * @returns {Promise<void>} Nothing.
   */
  const fetchModels = async ({ force = false } = {}) => {
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
  }

  const onBaseUrlBlur = () => fetchModels()
  const onApiKeyBlur = () => fetchModels()

  const onSave = async () => {
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
      notifyInfo({ key: 'userAiSettings.savedSuccessfully' })
    } catch (error) {
      notifyError({ key: 'userAiSettings.saveFailed', params: { message: error?.message || 'unknown' } })
    } finally {
      setSaving(false)
    }
  }

  const onTest = async () => {
    setTestResult({ pending: true })
    try {
      const result = await API.aiSettings.testConnection()
      setTestResult(result)
    } catch (error) {
      setTestResult({ ok: false, errorMessage: error?.message || 'unknown' })
    }
  }

  const onClear = async () => {
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
      notifyInfo({ key: 'userAiSettings.cleared' })
    } catch (error) {
      notifyError({ key: 'userAiSettings.saveFailed', params: { message: error?.message || 'unknown' } })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  if (settings?.aiFeaturesDisabled) {
    return (
      <fieldset className="user-ai-settings-panel">
        <legend>{i18n.t('userAiSettings.section')}</legend>
        <div className="user-ai-settings-panel__status user-ai-settings-panel__status--missing">
          {i18n.t('userAiSettings.featuresDisabled')}
        </div>
      </fieldset>
    )
  }

  const effective = settings?.effectiveSource
  const encryptionMissing = !settings?.encryptionConfigured

  const renderModelField = () => {
    if (!providerSpec.supportsModelList) return null
    const useDropdown = models.length > 0 && !form.modelFreeText
    return (
      <FormItem label="userAiSettings.model">
        {useDropdown ? (
          <div className="user-ai-settings-panel__model-row">
            <select className="user-ai-settings-panel__model-select" value={form.model} onChange={onModelSelectChange}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.description ? `${m.id} — ${m.description}` : m.id}
                </option>
              ))}
              <option value={OTHER_MODEL_VALUE}>{i18n.t('userAiSettings.modelOther')}</option>
            </select>
          </div>
        ) : (
          <div className="user-ai-settings-panel__model-row">
            <Input value={form.model} onChange={onModelChange} placeholder={MODEL_PLACEHOLDERS[form.provider]} />
            <button
              type="button"
              className="user-ai-settings-panel__fetch-models"
              onClick={() => fetchModels({ force: true })}
              disabled={modelsFetching}
            >
              {modelsFetching ? i18n.t('userAiSettings.fetchingModels') : i18n.t('userAiSettings.fetchModels')}
            </button>
          </div>
        )}
        {modelsError && (
          <div className="user-ai-settings-panel__hint user-ai-settings-panel__hint--error">
            {i18n.t('userAiSettings.modelsFetchFailed', { message: modelsError })}
          </div>
        )}
      </FormItem>
    )
  }

  return (
    <fieldset className="user-ai-settings-panel">
      <legend>{i18n.t('userAiSettings.section')}</legend>

      {encryptionMissing && (
        <div className="user-ai-settings-panel__status user-ai-settings-panel__status--missing">
          {i18n.t('userAiSettings.encryptionMissing')}
        </div>
      )}

      <FormItem label="userAiSettings.enableFeatures">
        <input type="checkbox" checked={form.featuresEnabled} onChange={onFeaturesEnabledChange} />
      </FormItem>

      {form.featuresEnabled && (
        <>
          <fieldset className="user-ai-settings-panel__categories">
            <legend>{i18n.t('userAiSettings.categoriesSection')}</legend>
            {FEATURE_CATEGORIES.map((category) => (
              <FormItem
                key={category}
                label={`userAiSettings.categories.${category}`}
                info={i18n.t(`userAiSettings.categories.${category}Hint`)}
              >
                <input
                  type="checkbox"
                  checked={!!form.featureToggles[category]}
                  onChange={onFeatureToggleChange(category)}
                />
              </FormItem>
            ))}
          </fieldset>

          <fieldset className="user-ai-settings-panel__provider">
            <legend>{i18n.t('userAiSettings.providerSection')}</legend>

            {effective && (
              <div className="user-ai-settings-panel__effective">
                {settings.effectiveProvider} / {settings.effectiveModel}
              </div>
            )}

            <FormItem label="userAiSettings.provider">
              <select value={form.provider} onChange={onProviderChange}>
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {i18n.t(`userAiSettings.providers.${p.value}`)}
                  </option>
                ))}
              </select>
            </FormItem>

            {providerSpec.isDefault ? (
              <div className="user-ai-settings-panel__hint">{i18n.t('userAiSettings.defaultProviderHint')}</div>
            ) : (
              <>
                {providerSpec.requiresBaseUrl && (
                  <FormItem label="userAiSettings.baseUrl">
                    <Input
                      value={form.baseUrl}
                      onChange={onBaseUrlChange}
                      onBlur={onBaseUrlBlur}
                      placeholder={BASE_URL_PLACEHOLDERS[form.provider]}
                    />
                  </FormItem>
                )}

                {form.provider !== 'vercel-ai-sdk' && (
                  <FormItem label="userAiSettings.apiKey">
                    <Input
                      type="password"
                      value={form.apiKey}
                      onChange={onApiKeyChange}
                      onBlur={onApiKeyBlur}
                      placeholder={settings?.hasApiKey ? '•'.repeat(16) : i18n.t('userAiSettings.apiKeyPlaceholder')}
                      disabled={encryptionMissing}
                    />
                  </FormItem>
                )}
                {settings?.hasApiKey && !form.apiKeyDirty && form.provider !== 'vercel-ai-sdk' && (
                  <div className="user-ai-settings-panel__hint">{i18n.t('userAiSettings.apiKeyKept')}</div>
                )}

                {renderModelField()}

                {form.provider === 'vercel-ai-sdk' && (
                  <div className="user-ai-settings-panel__hint">{i18n.t('userAiSettings.vercelAiSdkHint')}</div>
                )}
              </>
            )}
          </fieldset>
        </>
      )}

      <div className="user-ai-settings-panel__buttons">
        <Button
          className="btn-primary"
          label="userAiSettings.save"
          onClick={onSave}
          disabled={saving || encryptionMissing}
        />
        {form.featuresEnabled && !providerSpec.isDefault && (
          <Button
            label="userAiSettings.testConnection"
            onClick={onTest}
            disabled={
              saving || encryptionMissing || (providerSpec.requiresApiKey && !settings?.hasApiKey && !form.apiKeyDirty)
            }
          />
        )}
        {form.featuresEnabled && (
          <Button
            className="btn-danger"
            label="userAiSettings.clear"
            onClick={onClear}
            disabled={saving || (!settings?.hasApiKey && !settings?.provider)}
          />
        )}
      </div>

      {testResult ? (
        testResult.pending ? (
          <div className="user-ai-settings-panel__test">{i18n.t('userAiSettings.testing')}</div>
        ) : (
          <div className={`user-ai-settings-panel__test ${testResult.ok ? 'ok' : 'fail'}`}>
            {testResult.ok
              ? i18n.t('userAiSettings.testOk', { latencyMs: testResult.latencyMs })
              : i18n.t('userAiSettings.testFailed', { message: testResult.errorMessage || 'unknown' })}
          </div>
        )
      ) : null}
    </fieldset>
  )
}

export default UserAiSettingsPanel
