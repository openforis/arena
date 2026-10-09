import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getAiErrorMessage } from '@webapp/ai/runtime/runtimeErrors'
import {
  getCurrentUserUuid,
  loadAiCapabilities,
  refreshAiCapabilities,
  testLocalServer,
} from '@webapp/ai/engines/capabilitiesStore'
import {
  getBrowserStorage,
  loadLocalServerSettings,
  normalizeLocalServerSettings,
  saveLocalServerSettings,
} from '@webapp/ai/engines/localServerSettings'
import { getLocalServerTestView, type LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import type { AiLocalServerSettings } from '@webapp/ai/engines/types'
import { getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'
import { useAiCapabilities } from '@webapp/components/ai/hooks/useAiCapabilities'
import { Button as ButtonJS } from '@webapp/components/buttons'
import { Fieldset } from '@webapp/components/Fieldset'
import { Checkbox } from '@webapp/components/form'
import { FormItem, Input as InputJS } from '@webapp/components/form/Input'
import { Spinner } from '@webapp/components/Spinner'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

// forwardRef JS components lose their prop types in TS (same cast as UserAiSettingsPanel)
const Input = InputJS as React.ComponentType<any>
const Button = ButtonJS as React.ComponentType<any>

const LM_STUDIO_DOCS_URL = 'https://lmstudio.ai/docs'

type Props = {
  capabilityStats: boolean
  onCapabilityStatsChange: (checked: boolean) => void
}

const loadSettings = (): AiLocalServerSettings =>
  loadLocalServerSettings({ storage: getBrowserStorage(), userUuid: getCurrentUserUuid() })

/**
 * Local AI server settings (this browser only, saved on change) and the capability statistics switch (user prefs,
 * saved with the panel).
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The section.
 */
export const LocalAiSection = (props: Props) => {
  const { capabilityStats, onCapabilityStatsChange } = props
  const i18n = useI18n()
  const capabilities = useAiCapabilities()
  const [settings, setSettings] = useState<AiLocalServerSettings>(loadSettings)
  const [testing, setTesting] = useState(false)
  const [testView, setTestView] = useState<LocalServerTestView | null>(null)

  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  const save = useCallback((next: AiLocalServerSettings) => {
    setSettings(next)
    saveLocalServerSettings({ storage: getBrowserStorage(), userUuid: getCurrentUserUuid(), settings: next })
    // badge, availability and resolveModel follow the new settings (the store notifies its subscribers)
    refreshAiCapabilities().catch(() => undefined)
  }, [])

  const onTest = useCallback(async () => {
    const current = normalizeLocalServerSettings(settings)
    const testedUserUuid = getCurrentUserUuid()
    setTesting(true)
    setTestView(null)
    try {
      // the allowlist comes with the capabilities: classify with the loaded one, never the empty snapshot's
      const [probe, loaded] = await Promise.all([
        testLocalServer({ baseUrl: current.baseUrl, modelId: current.modelId }),
        loadAiCapabilities(),
      ])
      // the user logged out or switched meanwhile: write nothing for the new session
      if (getCurrentUserUuid() !== testedUserUuid) return
      // the URL was edited meanwhile: the result belongs to another server
      const latest = normalizeLocalServerSettings(settingsRef.current)
      if (latest.baseUrl !== current.baseUrl) return
      setTestView(
        getLocalServerTestView({
          probe,
          baseUrl: current.baseUrl,
          allowlist: loaded.instance.orgHostedBaseUrls,
          pageProtocol: window.location.protocol,
        })
      )
      // reachable: keep the chosen model if the server lists it, else pick the first one
      const modelId = probe.reachable
        ? current.modelId && probe.models.includes(current.modelId)
          ? current.modelId
          : (probe.models[0] ?? null)
        : current.modelId
      save({ ...latest, modelId })
    } finally {
      setTesting(false)
    }
  }, [save, settings])

  const onBaseUrlBlur = useCallback(() => {
    const next = normalizeLocalServerSettings(settings)
    const stored = loadSettings()
    if (next.baseUrl === stored.baseUrl) {
      // normalisation may differ from the typed text
      setSettings((prev) => (prev.baseUrl === next.baseUrl ? prev : { ...prev, baseUrl: next.baseUrl }))
      return
    }
    // a model of the previous server does not apply to the new one
    save({ ...next, modelId: null })
  }, [save, settings])

  const modelIds = useMemo(() => {
    const listed = testView?.models ?? capabilities.localServer.models
    return settings.modelId && !listed.includes(settings.modelId) ? [settings.modelId, ...listed] : listed
  }, [capabilities.localServer.models, settings.modelId, testView])

  const t = (key: string, params?: object): string => i18n.t(key, (params ?? {}) as Record<string, unknown>)

  const renderTestResult = () => {
    if (!testView) return null
    const location = getAiDataLocationText({
      location: { hostingClass: testView.hostingClass, provider: null, model: null, engine: null },
      t,
    })
    return (
      <div
        className={`user-ai-settings-panel__test ${testView.reachable ? 'ok' : 'fail'}`}
        data-testid={TestId.ai.localServerTestResult}
      >
        {testView.reachable ? (
          <>
            <div>{t('userAiSettings:localServer.reachable')}</div>
            {testView.models.length === 0 && <div>{t('userAiSettings:localServer.noModels')}</div>}
            <div>{t('userAiSettings:localServer.location', { location })}</div>
            <div>
              {testView.contextTokens
                ? t('userAiSettings:localServer.contextTokens', { count: testView.contextTokens })
                : t('userAiSettings:localServer.contextUnknown')}
            </div>
          </>
        ) : (
          <div>{getAiErrorMessage({ error: testView.error, i18n })}</div>
        )}
        {testView.showHttpsHint && <div>{t('userAiSettings:localServer.httpsHint')}</div>}
        {testView.showCloudWarning && <div>{t('userAiSettings:localServer.cloudWarning')}</div>}
      </div>
    )
  }

  return (
    <Fieldset className="user-ai-settings-panel__local-server" legend="userAiSettings:localServer.section">
      <FormItem label="userAiSettings:localServer.enabled">
        <Checkbox
          checked={settings.enabled}
          onChange={(checked: boolean) => save({ ...settings, enabled: checked })}
          testId={TestId.ai.localServerEnabled}
        />
      </FormItem>

      {settings.enabled && (
        <>
          <FormItem label="userAiSettings:localServer.baseUrl">
            <div className="user-ai-settings-panel__model-row">
              <Input
                value={settings.baseUrl}
                id={TestId.ai.localServerBaseUrl}
                onChange={(value: string) => {
                  setSettings((prev) => ({ ...prev, baseUrl: value }))
                  setTestView(null)
                }}
                onBlur={onBaseUrlBlur}
              />
              <Button
                label={testing ? 'userAiSettings:localServer.testing' : 'userAiSettings:localServer.test'}
                onClick={onTest}
                disabled={testing}
                icon={testing ? <Spinner size={16} /> : null}
                testId={TestId.ai.localServerTest}
              />
            </div>
          </FormItem>
          {renderTestResult()}

          <FormItem label="userAiSettings:localServer.model">
            <select
              className="user-ai-settings-panel__model-select"
              value={settings.modelId ?? ''}
              onChange={(event) => save({ ...settings, modelId: event.target.value || null })}
              data-testid={TestId.ai.localServerModel}
            >
              <option value="">{t('userAiSettings:localServer.modelPlaceholder')}</option>
              {modelIds.map((modelId) => (
                <option key={modelId} value={modelId}>
                  {modelId}
                </option>
              ))}
            </select>
          </FormItem>

          <FormItem label="userAiSettings:localServer.preferLocal">
            <Checkbox
              checked={settings.preferLocal}
              onChange={(checked: boolean) => save({ ...settings, preferLocal: checked })}
            />
          </FormItem>

          <div className="user-ai-settings-panel__hint">
            {t('userAiSettings:localServer.help')}{' '}
            <a href={LM_STUDIO_DOCS_URL} target="_blank" rel="noopener noreferrer">
              {t('userAiSettings:localServer.docsLink')}
            </a>
          </div>
          <div className="user-ai-settings-panel__hint">{t('userAiSettings:localServer.deviceNote')}</div>
        </>
      )}

      <FormItem
        label="userAiSettings:localServer.capabilityStats"
        info={t('userAiSettings:localServer.capabilityStatsHint')}
      >
        <Checkbox checked={capabilityStats} onChange={onCapabilityStatsChange} testId={TestId.ai.capabilityStats} />
      </FormItem>
    </Fieldset>
  )
}
