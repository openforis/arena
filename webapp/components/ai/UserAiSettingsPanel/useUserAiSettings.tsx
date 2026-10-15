/**
 * State of the AI settings panel: the loaded settings and the access level form (saved with the profile's Save).
 * The providers save themselves (ProviderList); `reloadSettings` reads their new key flags without touching the form.
 */
import { useCallback, useEffect, useState } from 'react'

import type { AiAccessLevel } from '@common/ai/accessLevel'

import * as API from '@webapp/service/api'

import { refreshAiCapabilities } from '@webapp/ai/engines/capabilitiesStore'
import { invalidateAiSettingsCache } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { useNotifyError, useNotifyInfo } from '@webapp/components/hooks'
import { useI18n } from '@webapp/store/system'

import {
  type AiSettings,
  buildSettingsUpdate,
  createEmptyForm,
  type FeatureCategory,
  type FormState,
  getApiErrorMessage,
  settingsToForm,
  withAccessLevel,
} from './aiSettingsForm'
import { useT } from './useT'

export type UseUserAiSettingsResult = {
  i18n: ReturnType<typeof useI18n>
  loading: boolean
  settings: AiSettings | null
  form: FormState
  dirty: boolean
  saving: boolean
  onAccessLevelChange: (level: AiAccessLevel) => void
  onFeatureToggleChange: (category: FeatureCategory) => (checked: boolean) => void
  onSave: () => Promise<void>
  reloadSettings: () => Promise<void>
}

/**
 * Returns true when the error says AI is disabled on this deployment.
 * @param {*} error - Axios error.
 * @returns {boolean} True for the disabled answer.
 */
const isAiDisabledError = (error: any): boolean => {
  const code = error?.response?.data?.key ?? error?.response?.data?.error
  return code === 'aiFeaturesDisabled' || error?.response?.status === 404
}

/**
 * Encapsulates the state and the logic of the UserAiSettingsPanel component.
 * @returns {UseUserAiSettingsResult} State and handlers.
 */
export const useUserAiSettings = (): UseUserAiSettingsResult => {
  const i18n = useI18n()
  const t = useT()
  const notifyInfo = useNotifyInfo()
  const notifyError = useNotifyError()

  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<AiSettings | null>(null)
  const [form, setForm] = useState<FormState>(createEmptyForm)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data: AiSettings = await API.aiSettings.fetchSettings()
      setSettings(data)
      setForm(settingsToForm(data))
      setDirty(false)
    } catch (error: any) {
      if (isAiDisabledError(error)) setSettings({ aiFeaturesDisabled: true })
      else notifyError({ key: 'common.fetchError', params: { message: getApiErrorMessage({ error, t }) } })
    } finally {
      setLoading(false)
    }
  }, [notifyError, t])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch settings on mount
    fetchSettings()
    // only on mount: a language change must not reload the settings and drop the unsaved form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // after a provider action: new settings, the unsaved level and switches stay
  const reloadSettings = useCallback(async () => {
    try {
      setSettings(await API.aiSettings.fetchSettings())
    } catch {
      // the list still shows the capabilities; the next action reloads again
    }
  }, [])

  const onAccessLevelChange = useCallback((level: AiAccessLevel) => {
    setForm((prev) => withAccessLevel(prev, level))
    setDirty(true)
  }, [])

  const onFeatureToggleChange = useCallback(
    (category: FeatureCategory) => (checked: boolean) => {
      setForm((prev) => ({ ...prev, featureToggles: { ...prev.featureToggles, [category]: checked } }))
      setDirty(true)
    },
    []
  )

  const onSave = useCallback(async () => {
    setSaving(true)
    try {
      const data: AiSettings = await API.aiSettings.saveSettings(buildSettingsUpdate(form))
      setSettings(data)
      setDirty(false)
      invalidateAiSettingsCache()
      // the features a level turns on or off change what the badges and menus show
      refreshAiCapabilities().catch(() => undefined)
      notifyInfo({ key: 'userAiSettings:savedSuccessfully' })
    } catch (error: any) {
      notifyError({ key: 'userAiSettings:saveFailed', params: { message: getApiErrorMessage({ error, t }) } })
    } finally {
      setSaving(false)
    }
  }, [form, notifyError, notifyInfo, t])

  return {
    i18n,
    loading,
    settings,
    form,
    dirty,
    saving,
    onAccessLevelChange,
    onFeatureToggleChange,
    onSave,
    reloadSettings,
  }
}
