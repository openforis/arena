import React from 'react'

import { AiProvider } from '@common/ai/aiProvider'

import { providerDisplayNames } from '@webapp/ai/policy/aiFeatureAvailability'
import { Button as ButtonJS } from '@webapp/components/buttons'
import { FormItem, Input as InputJS } from '@webapp/components/form/Input'
import { Spinner } from '@webapp/components/Spinner'
import { TestId } from '@webapp/utils/testId'

import {
  BASE_URL_PLACEHOLDERS,
  getCloudTestMessage,
  hasCloudApiKey,
  MODEL_PLACEHOLDERS,
  OTHER_MODEL_VALUE,
  PROVIDERS,
  shouldShowLocalUrlHint,
  toT,
} from './aiSettingsForm'
import { StatusPill } from './StatusPill'
import type { UseUserAiSettingsResult } from './useUserAiSettings'

// forwardRef JS components lose their prop types in TS (same cast as UserAiSettingsPanel)
const Input = InputJS as React.ComponentType<any>
const Button = ButtonJS as React.ComponentType<any>

type Props = {
  panel: UseUserAiSettingsResult
}

/**
 * Provider select ("Arena default" first).
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The field.
 */
const ProviderSelect = ({ panel }: Props) => (
  <FormItem label="userAiSettings:provider">
    <select
      className="user-ai-settings-panel__select"
      value={panel.form.provider}
      onChange={(event) => panel.onProviderChange(event.target.value)}
      data-testid={TestId.ai.cloudProvider}
    >
      {PROVIDERS.map((spec) => (
        <option key={spec.value} value={spec.value}>
          {panel.i18n.t(`userAiSettings:providers.${spec.value}`)}
        </option>
      ))}
    </select>
  </FormItem>
)

/**
 * What "Arena default" uses: the instance default provider, or that there is none.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The hint.
 */
const AdminDefaultHint = ({ panel }: Props) => {
  const { i18n, settings } = panel
  const adminDefault = settings?.adminDefault
  if (!adminDefault) {
    return <div className="user-ai-settings-panel__hint">{i18n.t('userAiSettings:cloud.defaultNone')}</div>
  }
  const providerName = providerDisplayNames[adminDefault.provider] ?? adminDefault.provider
  return (
    <div className="user-ai-settings-panel__hint">
      {i18n.t('userAiSettings:cloud.defaultHint')}{' '}
      <span>{[providerName, adminDefault.model].filter(Boolean).join(' · ')}</span>
    </div>
  )
}

/**
 * Base URL, with the hint to the local server for a local or private address.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The field.
 */
const BaseUrlField = ({ panel }: Props) => {
  const { i18n, form, providerSpec, allowlist, local } = panel
  const showHint = shouldShowLocalUrlHint({ spec: providerSpec, baseUrl: form.baseUrl, allowlist })
  return (
    <FormItem label="userAiSettings:baseUrl">
      <div className="user-ai-settings-panel__field">
        <Input
          id={TestId.ai.cloudBaseUrl}
          value={form.baseUrl}
          onChange={panel.onBaseUrlChange}
          onBlur={panel.onBaseUrlBlur}
          placeholder={BASE_URL_PLACEHOLDERS[form.provider]}
        />
        {showHint && (
          <div
            className="user-ai-settings-panel__hint user-ai-settings-panel__hint--warning"
            data-testid={TestId.ai.cloudBaseUrlHint}
          >
            {i18n.t('userAiSettings:cloud.localUrlHint')}{' '}
            <button
              type="button"
              className="user-ai-settings-panel__link"
              onClick={local.enableAndFocus}
              data-testid={TestId.ai.cloudBaseUrlHintLink}
            >
              {i18n.t('userAiSettings:cloud.localUrlLink')}
            </button>
          </div>
        )}
      </div>
    </FormItem>
  )
}

/**
 * API key, with the kept-key and unreadable-key hints.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The field.
 */
const ApiKeyField = ({ panel }: Props) => {
  const { i18n, form, settings } = panel
  const keyKept = !!settings?.hasApiKey && !form.apiKeyDirty
  return (
    <FormItem label="userAiSettings:apiKey">
      <div className="user-ai-settings-panel__field">
        <Input
          type="password"
          value={form.apiKey}
          onChange={panel.onApiKeyChange}
          onBlur={panel.onApiKeyBlur}
          placeholder={settings?.hasApiKey ? '•'.repeat(16) : i18n.t('userAiSettings:apiKeyPlaceholder')}
          disabled={!settings?.encryptionConfigured}
        />
        {keyKept && <div className="user-ai-settings-panel__hint">{i18n.t('userAiSettings:apiKeyKept')}</div>}
        {keyKept && settings?.apiKeyReadable === false && (
          <div className="user-ai-settings-panel__hint user-ai-settings-panel__hint--warning" role="alert">
            {i18n.t('userAiSettings:apiKeyUnreadable')}
          </div>
        )}
      </div>
    </FormItem>
  )
}

/**
 * Model: a select of the listed models (with "Other"), else a text input.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The field.
 */
const ModelField = ({ panel }: Props) => {
  const { i18n, form, cloud } = panel
  const useSelect = cloud.models.length > 0 && !form.modelFreeText
  return (
    <FormItem label="userAiSettings:model">
      <div className="user-ai-settings-panel__field">
        {useSelect ? (
          <select
            className="user-ai-settings-panel__select"
            value={form.model}
            onChange={(event) => panel.onModelSelectChange(event.target.value)}
            data-testid={TestId.ai.cloudModel}
          >
            {cloud.models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.description ? `${model.id} — ${model.description}` : model.id}
              </option>
            ))}
            <option value={OTHER_MODEL_VALUE}>{i18n.t('userAiSettings:modelOther')}</option>
          </select>
        ) : (
          <Input
            id={TestId.ai.cloudModel}
            value={form.model}
            onChange={panel.onModelChange}
            placeholder={MODEL_PLACEHOLDERS[form.provider]}
          />
        )}
        {cloud.modelsError && (
          <div className="user-ai-settings-panel__hint user-ai-settings-panel__hint--error">
            {i18n.t('userAiSettings:modelsFetchFailed', {
              message: cloud.modelsError,
              interpolation: { escapeValue: false },
            })}
          </div>
        )}
      </div>
    </FormItem>
  )
}

/**
 * Test, its result and Remove my provider.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The row.
 */
const CloudTestRow = ({ panel }: Props) => {
  const { i18n, form, settings, providerSpec, allowlist, cloud, saving } = panel
  // not disabled while the list loads: the blur of the field starts it, and Test lists the models itself
  const busy = saving || cloud.testing
  const missingKey = providerSpec.requiresApiKey && !hasCloudApiKey({ form, settings })
  const canRemove = !!settings?.provider || !!settings?.hasApiKey
  return (
    <div className="user-ai-settings-panel__row">
      <Button
        variant="outlined"
        label="userAiSettings:cloud.test"
        onClick={cloud.runTest}
        disabled={busy || missingKey}
        icon={cloud.testing ? <Spinner size={16} /> : null}
        testId={TestId.ai.cloudTest}
      />
      {cloud.testResult && (
        <StatusPill
          tone={cloud.testResult.ok ? 'ok' : 'bad'}
          text={getCloudTestMessage({
            result: cloud.testResult,
            spec: providerSpec,
            baseUrl: form.baseUrl,
            allowlist,
            t: toT(i18n),
          })}
          testId={TestId.ai.cloudTestResult}
        />
      )}
      <span className="user-ai-settings-panel__spacer" />
      <Button
        variant="text"
        label="userAiSettings:cloud.remove"
        onClick={panel.onRemoveProvider}
        disabled={saving || !canRemove}
        testId={TestId.ai.cloudRemove}
      />
    </div>
  )
}

/**
 * Fields of a personal provider.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The fields.
 */
const CloudProviderFields = ({ panel }: Props) => {
  const { i18n, form, providerSpec } = panel
  const isVercel = form.provider === AiProvider.vercelAiSdk
  return (
    <>
      {providerSpec.requiresBaseUrl && <BaseUrlField panel={panel} />}
      {!isVercel && <ApiKeyField panel={panel} />}
      {providerSpec.supportsModelList && <ModelField panel={panel} />}
      {isVercel && <div className="user-ai-settings-panel__hint">{i18n.t('userAiSettings:vercelAiSdkHint')}</div>}
      <CloudTestRow panel={panel} />
    </>
  )
}

/**
 * Cloud provider block (saved with the account).
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The block.
 */
export const CloudProviderSection = ({ panel }: Props) => (
  <div className="user-ai-settings-panel__engine">
    <div className="user-ai-settings-panel__engine-header">
      <span className="user-ai-settings-panel__engine-name">{panel.i18n.t('userAiSettings:cloud.name')}</span>
      <span className="user-ai-settings-panel__engine-where">{panel.i18n.t('userAiSettings:cloud.where')}</span>
    </div>
    <ProviderSelect panel={panel} />
    {panel.providerSpec.isDefault ? <AdminDefaultHint panel={panel} /> : <CloudProviderFields panel={panel} />}
  </div>
)
