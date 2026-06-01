import './UserAiSettingsPanel.scss'

import React, { useEffect, useImperativeHandle } from 'react'

import { AiProvider } from '@common/ai/aiProvider'

import { Spinner } from '@webapp/components/Spinner'
import { Button as ButtonJS } from '@webapp/components/buttons'
import { FormItem, Input as InputJS } from '@webapp/components/form/Input'
import { Fieldset } from '@webapp/components/Fieldset'
import { Checkbox, Dropdown } from '@webapp/components/form'

import {
  FEATURE_CATEGORIES,
  MODEL_PLACEHOLDERS,
  OTHER_MODEL_VALUE,
  PROVIDERS,
  BASE_URL_PLACEHOLDERS,
  useUserAiSettings,
} from './useUserAiSettings'

// forwardRef JS components lose their prop types in TS — cast to restore usability
const Input = InputJS as React.ComponentType<any>
const Button = ButtonJS as React.ComponentType<any>

type UserAiSettingsPanelProps = {
  onDirtyChange?: ((dirty: boolean) => void) | null
}

/**
 * Embeddable panel that lets the logged-in user configure their personal
 * LLM provider. Designed to be dropped inline on the User Edit page next
 * to the Map API Keys fieldset.
 *
 * The ref exposes the panel's save function so a parent can trigger it
 * externally (e.g. as part of a combined save action).
 */
const UserAiSettingsPanel = React.forwardRef<() => Promise<void>, UserAiSettingsPanelProps>(
  ({ onDirtyChange = null }, ref) => {
    const {
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
    } = useUserAiSettings()

    useImperativeHandle(ref, () => onSave, [onSave])

    useEffect(() => {
      onDirtyChange?.(dirty)
    }, [dirty, onDirtyChange])

    if (loading || !settings) return null

    if (settings.aiFeaturesDisabled) {
        <Fieldset className="user-ai-settings-panel" legend="userAiSettings:section">
          <div className="user-ai-settings-panel__status user-ai-settings-panel__status--missing">
            {i18n.t('userAiSettings:featuresDisabled')}
          </div>
        </Fieldset>
      )
    }

    const effective = settings?.effectiveSource
    const encryptionMissing = !settings?.encryptionConfigured

    const renderModelField = () => {
      if (!providerSpec.supportsModelList) return null
      const useDropdown = models.length > 0 && !form.modelFreeText
      return (
        <FormItem label="userAiSettings:model">
          {useDropdown ? (
            <div className="user-ai-settings-panel__model-row">
              <select
                className="user-ai-settings-panel__model-select"
                value={form.model}
                onChange={onModelSelectChange}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.description ? `${m.id} — ${m.description}` : m.id}
                  </option>
                ))}
                <option value={OTHER_MODEL_VALUE}>{i18n.t('userAiSettings:modelOther')}</option>
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
                {modelsFetching ? i18n.t('userAiSettings:fetchingModels') : i18n.t('userAiSettings:fetchModels')}
              </button>
            </div>
          )}
          {modelsError && (
            <div className="user-ai-settings-panel__hint user-ai-settings-panel__hint--error">
              {i18n.t('userAiSettings:modelsFetchFailed', { message: modelsError })}
            </div>
          )}
        </FormItem>
      )
    }

    return (
      <Fieldset className="user-ai-settings-panel" legend="userAiSettings:section">
        {encryptionMissing && (
          <div className="user-ai-settings-panel__status user-ai-settings-panel__status--missing">
            {i18n.t('userAiSettings:encryptionMissing')}
          </div>
        )}

        <FormItem label="userAiSettings:enableFeatures">
          <Checkbox checked={form.featuresEnabled} onChange={onFeaturesEnabledChange} />
        </FormItem>

        {form.featuresEnabled && (
          <>
            <Fieldset className="user-ai-settings-panel__categories" legend="userAiSettings:categoriesSection">
              {FEATURE_CATEGORIES.map((category) => (
                <FormItem
                  key={category}
                  label={`userAiSettings:categories.${category}`}
                  info={i18n.t(`userAiSettings:categories.${category}Hint`)}
                >
                  <Checkbox checked={!!form.featureToggles[category]} onChange={onFeatureToggleChange(category)} />
                </FormItem>
              ))}
            </Fieldset>

            <Fieldset className="user-ai-settings-panel__provider" legend="userAiSettings:providerSection">
              {effective && (
                <div className="user-ai-settings-panel__effective">
                  {settings.effectiveProvider} / {settings.effectiveModel}
                </div>
              )}

              <FormItem label="userAiSettings:provider">
                <Dropdown
                  className="form-input-container"
                  items={PROVIDERS}
                  itemValue="value"
                  itemLabel={(provider: any) => i18n.t(`userAiSettings:providers.${provider.value}`)}
                  onChange={onProviderChange}
                  selection={PROVIDERS.find((provider) => provider.value === form.provider) || PROVIDERS[0]}
                  clearable={false}
                  searchable={false}
                />
              </FormItem>

              {providerSpec.isDefault ? (
                <div className="user-ai-settings-panel__hint">{i18n.t('userAiSettings:defaultProviderHint')}</div>
              ) : (
                <>
                  {providerSpec.requiresBaseUrl && (
                    <FormItem label="userAiSettings:baseUrl">
                      <Input
                        value={form.baseUrl}
                        onChange={onBaseUrlChange}
                        onBlur={onBaseUrlBlur}
                        placeholder={BASE_URL_PLACEHOLDERS[form.provider]}
                      />
                    </FormItem>
                  )}

                  {form.provider !== AiProvider.vercelAiSdk && (
                    <FormItem label="userAiSettings:apiKey">
                      <Input
                        type="password"
                        value={form.apiKey}
                        onChange={onApiKeyChange}
                        onBlur={onApiKeyBlur}
                        placeholder={settings?.hasApiKey ? '•'.repeat(16) : i18n.t('userAiSettings:apiKeyPlaceholder')}
                        disabled={encryptionMissing}
                      />
                    </FormItem>
                  )}
                  {settings?.hasApiKey && !form.apiKeyDirty && form.provider !== AiProvider.vercelAiSdk && (
                    <div className="user-ai-settings-panel__hint">{i18n.t('userAiSettings:apiKeyKept')}</div>
                  )}

                  {renderModelField()}

                  {form.provider === AiProvider.vercelAiSdk && (
                    <div className="user-ai-settings-panel__hint">{i18n.t('userAiSettings:vercelAiSdkHint')}</div>
                  )}
                </>
              )}
            </Fieldset>
          </>
        )}

        <div className="user-ai-settings-panel__buttons">
          {form.featuresEnabled && !providerSpec.isDefault && (
            <Button
              label="userAiSettings:testConnection"
              onClick={onTest}
              disabled={
                saving ||
                testing ||
                encryptionMissing ||
                (providerSpec.requiresApiKey && !settings?.hasApiKey && !form.apiKeyDirty)
              }
              icon={testing ? <Spinner size={16} /> : null}
            />
          )}
          <span className="user-ai-settings-panel__buttons-spacer" />
          {form.featuresEnabled && (
            <Button
              variant="text"
              label="userAiSettings:clear"
              onClick={onClear}
              disabled={saving || (!settings?.hasApiKey && !settings?.provider)}
            />
          )}
        </div>

        {testResultView}
      </Fieldset>
    )
  }
)

export default UserAiSettingsPanel
