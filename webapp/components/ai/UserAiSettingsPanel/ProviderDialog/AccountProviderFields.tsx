import React from 'react'

import { Button as ButtonJS } from '@webapp/components/buttons'
import { FormItem, Input as InputJS } from '@webapp/components/form/Input'
import { Spinner } from '@webapp/components/Spinner'
import { TestId } from '@webapp/utils/testId'

import { StatusPill } from '../StatusPill'
import { BASE_URL_PLACEHOLDERS, MODEL_PLACEHOLDERS, OTHER_MODEL_VALUE } from '../aiSettingsForm'
import { getAccountTestMessage } from './providerDraft'
import type { ProviderDialogApi } from './useProviderDialog'

// forwardRef components lose their prop types in TS (same cast as the panel)
const Input = InputJS as React.ComponentType<any>
const Button = ButtonJS as React.ComponentType<any>

type Props = {
  dialog: ProviderDialogApi
}

/**
 * Base URL, with the allowlist of an Organisation server and the hint for an address on this computer or network.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The field.
 */
const BaseUrlField = ({ dialog }: Props) => {
  const { t, draft, spec, context } = dialog
  const isOrgServer = spec.value === 'orgServer'
  return (
    <FormItem label="userAiSettings:baseUrl">
      <div className="provider-dialog__field">
        <Input
          id={TestId.ai.providerBaseUrl}
          value={draft.baseUrl}
          onChange={dialog.setBaseUrl}
          onBlur={dialog.commitBaseUrl}
          placeholder={isOrgServer ? context.allowlist[0] : BASE_URL_PLACEHOLDERS[spec.providerType]}
        />
        {isOrgServer && (
          <div className="provider-dialog__hint">
            {t('userAiSettings:dialog.orgServerHint', {
              urls: context.allowlist.join(', '),
              interpolation: { escapeValue: false },
            })}
          </div>
        )}
        {dialog.orgServerRefused && (
          <div className="provider-dialog__hint provider-dialog__hint--warning" role="alert">
            {t('userAiSettings:dialog.orgServerNotAllowed')}
          </div>
        )}
        {dialog.localUrlHint && (
          <div className="provider-dialog__hint provider-dialog__hint--warning">
            {t('userAiSettings:dialog.localUrlHint')}{' '}
            {/* the type cannot change while editing: another type is another provider */}
            {!dialog.editing && (
              <button
                type="button"
                className="provider-dialog__link"
                onClick={dialog.switchToLocalServer}
                data-testid={TestId.ai.providerUseLocal}
              >
                {t('userAiSettings:dialog.useLocalServer')}
              </button>
            )}
          </div>
        )}
      </div>
    </FormItem>
  )
}

/**
 * API key, with the kept, cleared, unreadable and encryption-missing hints.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The field.
 */
const ApiKeyField = ({ dialog }: Props) => {
  const { t, draft, saved, context, keyCleared } = dialog
  const typed = draft.apiKey.trim().length > 0
  const unreadable = !!saved?.hasApiKey && !saved.apiKeyReadable
  const keyKept = !!saved?.hasApiKey && !keyCleared && !unreadable && !typed
  return (
    <FormItem label="userAiSettings:apiKey">
      <div className="provider-dialog__field">
        <Input
          type="password"
          id={TestId.ai.providerApiKey}
          value={draft.apiKey}
          onChange={dialog.setApiKey}
          onBlur={dialog.commitApiKey}
          placeholder={keyKept ? '•'.repeat(16) : t('userAiSettings:apiKeyPlaceholder')}
          disabled={!context.encryptionConfigured}
        />
        {!context.encryptionConfigured && (
          <div className="provider-dialog__hint provider-dialog__hint--warning">
            {t('userAiSettings:encryptionMissing')}
          </div>
        )}
        {keyKept && <div className="provider-dialog__hint">{t('userAiSettings:apiKeyKept')}</div>}
        {keyCleared && !typed && (
          <div className="provider-dialog__hint provider-dialog__hint--warning" role="alert">
            {t('userAiSettings:dialog.apiKeyCleared')}
          </div>
        )}
        {unreadable && !keyCleared && !typed && (
          <div className="provider-dialog__hint provider-dialog__hint--warning" role="alert">
            {t('userAiSettings:apiKeyUnreadable')}
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
const ModelField = ({ dialog }: Props) => {
  const { t, draft, spec, models } = dialog
  const useSelect = models.length > 0 && !draft.modelFreeText
  return (
    <FormItem label="userAiSettings:model">
      <div className="provider-dialog__field">
        <div className="provider-dialog__row">
          <div className="provider-dialog__grow">
            {useSelect ? (
              <select
                className="provider-dialog__select"
                aria-label={t('userAiSettings:model')}
                value={draft.model}
                onChange={(event) => dialog.selectModel(event.target.value)}
                data-testid={TestId.ai.providerModel}
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.description ? `${model.id} — ${model.description}` : model.id}
                  </option>
                ))}
                <option value={OTHER_MODEL_VALUE}>{t('userAiSettings:modelOther')}</option>
              </select>
            ) : (
              <Input
                id={TestId.ai.providerModel}
                value={draft.model}
                onChange={dialog.setModel}
                placeholder={MODEL_PLACEHOLDERS[spec.providerType]}
              />
            )}
          </div>
          {dialog.modelsFetching && <span className="provider-dialog__hint">{t('common.loading')}</span>}
        </div>
        {dialog.modelsError && (
          <div className="provider-dialog__hint provider-dialog__hint--error">
            {t('userAiSettings:modelsFetchFailed', {
              message: dialog.modelsError,
              interpolation: { escapeValue: false },
            })}
          </div>
        )}
      </div>
    </FormItem>
  )
}

/**
 * Test and its result.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The row.
 */
const TestRow = ({ dialog }: Props) => {
  const { t, test, spec, draft, context } = dialog
  const result = test?.account ?? null
  return (
    <div className="provider-dialog__row">
      <Button
        variant="outlined"
        label="userAiSettings:dialog.test"
        onClick={dialog.runTest}
        disabled={!dialog.canTest}
        icon={dialog.testing ? <Spinner size={16} /> : null}
        testId={TestId.ai.providerTest}
      />
      {/* always rendered, so a screen reader announces the result when it appears */}
      <span role="status" className="provider-dialog__live">
        {result && (
          <StatusPill
            tone={result.ok ? 'ok' : 'bad'}
            text={getAccountTestMessage({ result, spec, baseUrl: draft.baseUrl, allowlist: context.allowlist, t })}
            testId={TestId.ai.providerTestResult}
          />
        )}
      </span>
    </div>
  )
}

/**
 * Step 2 for an account provider: base URL where the type needs it, API key, model, Test.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The fields.
 */
export const AccountProviderFields = ({ dialog }: Props) => {
  const { spec, t } = dialog
  return (
    <>
      {spec.requiresBaseUrl && <BaseUrlField dialog={dialog} />}
      {spec.hasApiKeyField && <ApiKeyField dialog={dialog} />}
      {spec.supportsModelList && <ModelField dialog={dialog} />}
      {spec.value === 'vercel-ai-sdk' && (
        <div className="provider-dialog__hint">{t('userAiSettings:vercelAiSdkHint')}</div>
      )}
      <TestRow dialog={dialog} />
    </>
  )
}
