/**
 * State of the AI settings panel: account settings form, cloud provider, local server draft and status line.
 */
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import * as API from '@webapp/service/api'

import { refreshAiCapabilities } from '@webapp/ai/engines/capabilitiesStore'
import { invalidateAiSettingsCache } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { useNotifyError, useNotifyInfo } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'

import {
  type AiEngineStatus,
  getAiEngineStatus,
  getCloudEngineCandidate,
  getLocalEngineCandidate,
} from './aiEngineStatus'
import {
  type AiSettings,
  buildSettingsUpdate,
  createEmptyForm,
  type FeatureCategory,
  type FormState,
  getProviderSpec,
  hasCloudApiKey,
  isCloudDraftSaved,
  OTHER_MODEL_VALUE,
  type ProviderSpec,
  settingsToForm,
  withoutCloudProvider,
} from './aiSettingsForm'
import { saveAiPanelSettings } from './localServerDraft'
import { type CloudProviderApi, useCloudProvider } from './useCloudProvider'
import { type LocalServerDraftApi, useLocalServerDraft } from './useLocalServerDraft'

const NO_ALLOWLIST: string[] = []

export type UseUserAiSettingsResult = {
  i18n: ReturnType<typeof useI18n>
  loading: boolean
  settings: AiSettings | null
  form: FormState
  dirty: boolean
  saving: boolean
  providerSpec: ProviderSpec
  allowlist: string[]
  local: LocalServerDraftApi
  cloud: CloudProviderApi
  engineStatus: AiEngineStatus
  onProviderChange: (provider: string) => void
  onModelChange: (value: string) => void
  onModelSelectChange: (value: string) => void
  onBaseUrlChange: (value: string) => void
  onApiKeyChange: (value: string) => void
  onBaseUrlBlur: () => void
  onApiKeyBlur: () => void
  onFeaturesEnabledChange: (checked: boolean) => void
  onFeatureToggleChange: (category: FeatureCategory) => (checked: boolean) => void
  onSave: () => Promise<void>
  onRemoveProvider: () => Promise<void>
}

type SetForm = React.Dispatch<React.SetStateAction<FormState>>

/**
 * Returns the change handlers of the form fields; each edit marks the panel dirty.
 * @param {SetForm} setForm - Form setter.
 * @param {Function} markDirty - Marks the account settings as edited.
 * @returns {object} The handlers.
 */
const useFormFieldHandlers = (setForm: SetForm, markDirty: () => void) => {
  const update = useCallback(
    (patch: (prev: FormState) => Partial<FormState>) => {
      setForm((prev) => ({ ...prev, ...patch(prev) }))
      markDirty()
    },
    [markDirty, setForm]
  )
  const onModelChange = useCallback((model: string) => update(() => ({ model })), [update])
  const onModelSelectChange = useCallback(
    (value: string) =>
      update(() => (value === OTHER_MODEL_VALUE ? { modelFreeText: true } : { model: value, modelFreeText: false })),
    [update]
  )
  const onBaseUrlChange = useCallback((baseUrl: string) => update(() => ({ baseUrl })), [update])
  const onApiKeyChange = useCallback(
    (apiKey: string) => update((prev) => ({ apiKey, apiKeyDirty: true, apiKeyVersion: prev.apiKeyVersion + 1 })),
    [update]
  )
  const onFeaturesEnabledChange = useCallback(
    (featuresEnabled: boolean) => update(() => ({ featuresEnabled })),
    [update]
  )
  const onFeatureToggleChange = useCallback(
    (category: FeatureCategory) => (checked: boolean) =>
      update((prev) => ({ featureToggles: { ...prev.featureToggles, [category]: checked } })),
    [update]
  )
  return {
    onModelChange,
    onModelSelectChange,
    onBaseUrlChange,
    onApiKeyChange,
    onFeaturesEnabledChange,
    onFeatureToggleChange,
  }
}

/**
 * Encapsulates the state and the logic of the UserAiSettingsPanel component.
 * @returns {UseUserAiSettingsResult} State and handlers.
 */
export const useUserAiSettings = (): UseUserAiSettingsResult => {
  const i18n = useI18n()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()

  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<AiSettings | null>(null)
  const [form, setForm] = useState<FormState>(createEmptyForm)
  const [formDirty, setFormDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const markDirty = useCallback(() => setFormDirty(true), [])
  const providerSpec = useMemo(() => getProviderSpec(form.provider), [form.provider])
  const allowlist = settings?.orgHostedBaseUrls ?? NO_ALLOWLIST
  const local = useLocalServerDraft()
  const cloud = useCloudProvider({ form, setForm, spec: providerSpec, settings, allowlist, markDirty, i18n })
  const { fetchModels, resetModels } = cloud
  const fieldHandlers = useFormFieldHandlers(setForm, markDirty)
  // the account settings or the local server draft changed
  const dirty = formDirty || local.dirty

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data: AiSettings = await API.aiSettings.fetchSettings()
      setSettings(data)
      setForm(settingsToForm(data))
      setFormDirty(false)
    } catch (error: any) {
      const code = error?.response?.data?.key ?? error?.response?.data?.error
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch settings on mount
    fetchSettings()
  }, [fetchSettings])

  const onProviderChange = useCallback(
    (provider: string) => {
      setForm((prev) => ({ ...prev, provider, baseUrl: '', model: '', modelFreeText: false }))
      resetModels()
      markDirty()
    },
    [markDirty, resetModels]
  )

  const onBaseUrlBlur = useCallback(() => {
    fetchModels()
  }, [fetchModels])
  const onApiKeyBlur = useCallback(() => {
    fetchModels()
  }, [fetchModels])

  // the account part of Save (PUT); the local server settings are written after it
  const saveServerSettings = useCallback(async (): Promise<AiSettings> => {
    const data: AiSettings = await API.aiSettings.saveSettings(buildSettingsUpdate({ form, spec: providerSpec }) as any)
    setSettings(data)
    setForm((prev) => ({ ...prev, apiKey: '', apiKeyDirty: false }))
    setFormDirty(false)
    invalidateAiSettingsCache()
    return data
  }, [form, providerSpec])

  const onSave = useCallback(async () => {
    setSaving(true)
    try {
      const { localSaved } = await saveAiPanelSettings({
        saveServer: formDirty ? saveServerSettings : null,
        saveLocal: local.save,
        refresh: refreshAiCapabilities,
      })
      if (localSaved) notifyInfo({ key: 'userAiSettings:savedSuccessfully' })
      else notifyError({ key: 'userAiSettings:localServer.notSaved' })
    } catch (error: any) {
      notifyError({ key: 'userAiSettings:saveFailed', params: { message: error?.message || 'unknown' } })
    } finally {
      setSaving(false)
    }
  }, [formDirty, local.save, notifyError, notifyInfo, saveServerSettings])

  const onRemoveProvider = useCallback(async () => {
    setSaving(true)
    try {
      const data: AiSettings = await API.aiSettings.clearSettings()
      setSettings(data)
      // the switch edits not saved yet stay, so the panel may stay dirty
      setForm(withoutCloudProvider)
      resetModels()
      invalidateAiSettingsCache()
      // the gateway and its hosting class may have changed
      refreshAiCapabilities().catch(() => undefined)
      notifyInfo({ key: 'userAiSettings:cloud.removed' })
    } catch (error: any) {
      notifyError({ key: 'userAiSettings:saveFailed', params: { message: error?.message || 'unknown' } })
    } finally {
      setSaving(false)
    }
  }, [notifyError, notifyInfo, resetModels])

  const engineStatus = useMemo(
    () =>
      getAiEngineStatus({
        preferLocal: local.draft.preferLocal,
        local: getLocalEngineCandidate({ draft: local.draft, testView: local.testView, allowlist }),
        cloud: getCloudEngineCandidate({
          spec: providerSpec,
          draft: {
            provider: form.provider,
            model: form.model,
            baseUrl: form.baseUrl,
            hasApiKey: hasCloudApiKey({ form, settings }),
          },
          adminDefault: settings?.adminDefault ?? null,
          allowlist,
          saved: { matches: isCloudDraftSaved({ form, settings }), lastTestOk: settings?.lastTestOk ?? null },
          testOk: cloud.testResult ? cloud.testResult.ok : null,
        }),
      }),
    [allowlist, cloud.testResult, form, local.draft, local.testView, providerSpec, settings]
  )

  return {
    i18n,
    loading,
    settings,
    form,
    dirty,
    saving,
    providerSpec,
    allowlist,
    local,
    cloud,
    engineStatus,
    onProviderChange,
    ...fieldHandlers,
    onBaseUrlBlur,
    onApiKeyBlur,
    onSave,
    onRemoveProvider,
  }
}
