import './UserAiSettingsPanel.scss'

import React from 'react'

import { Button } from '@webapp/components/buttons'
import { FormItem, Input } from '@webapp/components/form/Input'
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

/**
 * Embeddable panel that lets the logged-in user configure their personal
 * LLM provider. Designed to be dropped inline on the User Edit page next
 * to the Map API Keys fieldset.
 * @returns {React.Element} Panel.
 */
const UserAiSettingsPanel = () => {
  const {
    i18n,
    loading,
    settings,
    form,
    saving,
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

  if (loading) return null

  if (settings?.aiFeaturesDisabled) {
    return (
      <fieldset className="user-ai-settings-panel">
        <legend>{i18n.t('userAiSettings:section')}</legend>
        <div className="user-ai-settings-panel__status user-ai-settings-panel__status--missing">
          {i18n.t('userAiSettings:featuresDisabled')}
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
      <FormItem label="userAiSettings:model">
        {useDropdown ? (
          <div className="user-ai-settings-panel__model-row">
            <select className="user-ai-settings-panel__model-select" value={form.model} onChange={onModelSelectChange}>
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
    <Fieldset className="user-ai-settings-panel" label="userAiSettings:section">
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
          <Fieldset className="user-ai-settings-panel__categories" label="userAiSettings:categoriesSection">
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

          <Fieldset className="user-ai-settings-panel__provider" label="userAiSettings:providerSection">
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
                itemLabel={(provider) => i18n.t(`userAiSettings:providers.${provider.value}`)}
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

                {form.provider !== 'vercel-ai-sdk' && (
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
                {settings?.hasApiKey && !form.apiKeyDirty && form.provider !== 'vercel-ai-sdk' && (
                  <div className="user-ai-settings-panel__hint">{i18n.t('userAiSettings:apiKeyKept')}</div>
                )}

                {renderModelField()}

                {form.provider === 'vercel-ai-sdk' && (
                  <div className="user-ai-settings-panel__hint">{i18n.t('userAiSettings:vercelAiSdkHint')}</div>
                )}
              </>
            )}
          </Fieldset>
        </>
      )}

      <div className="user-ai-settings-panel__buttons">
        <Button
          className="btn-primary"
          label="userAiSettings:save"
          onClick={onSave}
          disabled={saving || encryptionMissing}
        />
        {form.featuresEnabled && !providerSpec.isDefault && (
          <Button
            label="userAiSettings:testConnection"
            onClick={onTest}
            disabled={
              saving || encryptionMissing || (providerSpec.requiresApiKey && !settings?.hasApiKey && !form.apiKeyDirty)
            }
          />
        )}
        {form.featuresEnabled && (
          <Button
            className="btn-danger"
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

export default UserAiSettingsPanel
