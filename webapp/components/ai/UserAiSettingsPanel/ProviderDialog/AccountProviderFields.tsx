import React from 'react'

import { Button } from '@webapp/components/buttons'
import { FormItem, Input } from '@webapp/components/form/Input'
import { PasswordInput } from '@webapp/components/form/PasswordInput'
import { Spinner } from '@webapp/components/Spinner'
import { TestId } from '@webapp/utils/testId'

import { StatusPill } from '../StatusPill'
import { useT } from '../useT'
import { type ApiKeyFieldState, getApiKeyFieldState } from './apiKeyField'
import type { ModelsState, ProviderDialogView } from './providerDialogState'
import type { ProviderDraft } from './providerDraft'
import { type AiModel, OTHER_MODEL_VALUE } from './providerModels'
import { getAccountTestMessage } from './providerTest'
import { BASE_URL_PLACEHOLDERS, MODEL_PLACEHOLDERS, type ProviderTypeSpec, type SavedProvider } from './providerTypes'
import type { ProviderDialogActions } from './useProviderDialog'

type BaseUrlFieldProps = {
  baseUrl: string
  placeholder: string | undefined
  isOrgServer: boolean
  allowlist: string[]
  orgServerRefused: boolean
  localUrlHint: boolean
  // the type cannot change while editing: another type is another provider
  editing: boolean
  onChange: (baseUrl: string) => void
  onBlur: () => void
  onUseLocalServer: () => void
}

/**
 * Base URL, with the allowlist of an Organisation server and the hint for an address on this computer or network.
 * @param {BaseUrlFieldProps} props - Props.
 * @returns {React.ReactElement} The field.
 */
const BaseUrlField = (props: BaseUrlFieldProps) => {
  const { baseUrl, placeholder, isOrgServer, allowlist, orgServerRefused, localUrlHint, editing } = props
  const t = useT()
  return (
    <FormItem label="userAiSettings:baseUrl" htmlFor={TestId.ai.providerBaseUrl}>
      <div className="provider-dialog__field">
        <Input
          id={TestId.ai.providerBaseUrl}
          value={baseUrl}
          onChange={props.onChange}
          onBlur={props.onBlur}
          placeholder={placeholder}
        />
        {isOrgServer && (
          <div className="provider-dialog__hint">
            {t('userAiSettings:dialog.orgServerHint', {
              urls: allowlist.join(', '),
              interpolation: { escapeValue: false },
            })}
          </div>
        )}
        {orgServerRefused && (
          <div className="provider-dialog__hint provider-dialog__hint--warning" role="alert">
            {t('userAiSettings:dialog.orgServerNotAllowed')}
          </div>
        )}
        {localUrlHint && (
          <div className="provider-dialog__hint provider-dialog__hint--warning">
            {t('userAiSettings:dialog.localUrlHint')}{' '}
            {!editing && (
              <button
                type="button"
                className="provider-dialog__link"
                onClick={props.onUseLocalServer}
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

type ApiKeyFieldProps = {
  apiKey: string
  fieldState: ApiKeyFieldState
  encryptionConfigured: boolean
  canRemoveKey: boolean
  onChange: (apiKey: string) => void
  onBlur: () => void
  onRemoveKey: () => void
  onKeepKey: () => void
}

/**
 * API key, with the kept, removed, cleared, unreadable and encryption-missing hints.
 * @param {ApiKeyFieldProps} props - Props.
 * @returns {React.ReactElement} The field.
 */
const ApiKeyField = (props: ApiKeyFieldProps) => {
  const { apiKey, fieldState, encryptionConfigured, canRemoveKey } = props
  const { keyKept, keyRemoved, placeholderKey, showClearedHint, showUnreadableHint } = fieldState
  const t = useT()
  return (
    <FormItem label="userAiSettings:apiKey" htmlFor={TestId.ai.providerApiKey}>
      <div className="provider-dialog__field">
        {/* new-password: a browser must not fill in the Arena login password, which Test would send to the URL */}
        <PasswordInput
          autoComplete="new-password"
          id={TestId.ai.providerApiKey}
          testId={TestId.ai.providerApiKey}
          value={apiKey}
          onChange={props.onChange}
          onBlur={props.onBlur}
          placeholder={placeholderKey}
          disabled={!encryptionConfigured}
          // the key is not a login: keep password managers from offering to save or generate it
          data-1p-ignore="true"
          data-lpignore="true"
          data-bwignore="true"
          data-form-type="other"
        />
        {!encryptionConfigured && (
          <div className="provider-dialog__hint provider-dialog__hint--warning">
            {t('userAiSettings:encryptionMissing')}
          </div>
        )}
        {keyKept && <div className="provider-dialog__hint">{t('userAiSettings:apiKeyKept')}</div>}
        {showClearedHint && (
          <div className="provider-dialog__hint provider-dialog__hint--warning" role="alert">
            {t('userAiSettings:dialog.apiKeyCleared')}
          </div>
        )}
        {showUnreadableHint && (
          <div className="provider-dialog__hint provider-dialog__hint--warning" role="alert">
            {t('userAiSettings:apiKeyUnreadable')}
          </div>
        )}
        {/* always rendered, so a screen reader announces the text when it appears */}
        <div role="status" className="provider-dialog__status">
          {keyRemoved && (
            <div className="provider-dialog__hint provider-dialog__hint--warning">
              {t('userAiSettings:dialog.apiKeyRemoved')}
            </div>
          )}
        </div>
        {/* one button for both states, so it keeps the focus */}
        {(canRemoveKey || keyRemoved) && (
          <Button
            variant="text"
            size="small"
            label={keyRemoved ? 'userAiSettings:dialog.keepKey' : 'userAiSettings:dialog.removeKey'}
            aria-pressed={keyRemoved}
            onClick={keyRemoved ? props.onKeepKey : props.onRemoveKey}
            testId={keyRemoved ? TestId.ai.providerKeepKey : TestId.ai.providerRemoveKey}
          />
        )}
      </div>
    </FormItem>
  )
}

type ModelFieldProps = {
  model: string
  placeholder: string | undefined
  // a select when the provider listed its models (and "Other" was not chosen), else a text input
  models: AiModel[]
  useSelect: boolean
  fetching: boolean
  error: string | null
  onSelect: (value: string) => void
  onChange: (model: string) => void
}

/**
 * Model: a select of the listed models (with "Other"), else a text input.
 * @param {ModelFieldProps} props - Props.
 * @returns {React.ReactElement} The field.
 */
const ModelField = (props: ModelFieldProps) => {
  const { model, placeholder, models, useSelect, fetching, error } = props
  const t = useT()
  return (
    <FormItem label="userAiSettings:model" htmlFor={TestId.ai.providerModel}>
      <div className="provider-dialog__field">
        <div className="provider-dialog__row">
          <div className="provider-dialog__grow">
            {useSelect ? (
              <select
                id={TestId.ai.providerModel}
                className="provider-dialog__select"
                value={model}
                onChange={(event) => props.onSelect(event.target.value)}
                data-testid={TestId.ai.providerModel}
              >
                {models.map((listed) => (
                  <option key={listed.id} value={listed.id}>
                    {listed.description ? `${listed.id} — ${listed.description}` : listed.id}
                  </option>
                ))}
                <option value={OTHER_MODEL_VALUE}>{t('userAiSettings:modelOther')}</option>
              </select>
            ) : (
              <Input id={TestId.ai.providerModel} value={model} onChange={props.onChange} placeholder={placeholder} />
            )}
          </div>
          {fetching && <span className="provider-dialog__hint">{t('common.loading')}</span>}
        </div>
        {error && (
          <div className="provider-dialog__hint provider-dialog__hint--error">
            {t('userAiSettings:modelsFetchFailed', { message: error, interpolation: { escapeValue: false } })}
          </div>
        )}
      </div>
    </FormItem>
  )
}

type TestRowProps = {
  // the text of the result, null before a test
  result: { ok: boolean; text: string } | null
  testing: boolean
  canTest: boolean
  onTest: () => void
}

/**
 * Test and its result.
 * @param {TestRowProps} props - Props.
 * @returns {React.ReactElement} The row.
 */
const TestRow = ({ result, testing, canTest, onTest }: TestRowProps) => (
  <div className="provider-dialog__row">
    <Button
      variant="outlined"
      label="userAiSettings:dialog.test"
      onClick={onTest}
      disabled={!canTest}
      icon={testing ? <Spinner size={16} /> : null}
      testId={TestId.ai.providerTest}
    />
    {/* always rendered, so a screen reader announces the result when it appears */}
    <span role="status" className="provider-dialog__live">
      {result && (
        <StatusPill tone={result.ok ? 'ok' : 'bad'} text={result.text} testId={TestId.ai.providerTestResult} />
      )}
    </span>
  </div>
)

type Props = {
  spec: ProviderTypeSpec
  draft: ProviderDraft
  saved: SavedProvider | null
  allowlist: string[]
  encryptionConfigured: boolean
  models: ModelsState
  view: Pick<
    ProviderDialogView,
    'test' | 'keyCleared' | 'canRemoveKey' | 'orgServerRefused' | 'localUrlHint' | 'canTest'
  >
  testing: boolean
  actions: Pick<
    ProviderDialogActions,
    | 'setBaseUrl'
    | 'commitBaseUrl'
    | 'switchToLocalServer'
    | 'setApiKey'
    | 'commitApiKey'
    | 'removeKey'
    | 'keepKey'
    | 'selectModel'
    | 'setModel'
    | 'runTest'
  >
}

/**
 * Step 2 for an account provider: base URL where the type needs it, API key, model, Test.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The fields.
 */
export const AccountProviderFields = ({
  spec,
  draft,
  saved,
  allowlist,
  encryptionConfigured,
  models,
  view,
  testing,
  actions,
}: Props) => {
  const t = useT()
  const isOrgServer = spec.value === 'orgServer'
  const account = view.test?.account ?? null
  const testText = account
    ? getAccountTestMessage({ result: account, spec, baseUrl: draft.baseUrl, allowlist, t })
    : null
  return (
    <>
      {spec.requiresBaseUrl && (
        <BaseUrlField
          baseUrl={draft.baseUrl}
          placeholder={isOrgServer ? allowlist[0] : BASE_URL_PLACEHOLDERS[spec.providerType]}
          isOrgServer={isOrgServer}
          allowlist={allowlist}
          orgServerRefused={view.orgServerRefused}
          localUrlHint={view.localUrlHint}
          editing={!!saved}
          onChange={actions.setBaseUrl}
          onBlur={actions.commitBaseUrl}
          onUseLocalServer={actions.switchToLocalServer}
        />
      )}
      {spec.hasApiKeyField && (
        <ApiKeyField
          apiKey={draft.apiKey}
          fieldState={getApiKeyFieldState({ draft, saved, keyCleared: view.keyCleared })}
          encryptionConfigured={encryptionConfigured}
          canRemoveKey={view.canRemoveKey}
          onChange={actions.setApiKey}
          onBlur={actions.commitApiKey}
          onRemoveKey={actions.removeKey}
          onKeepKey={actions.keepKey}
        />
      )}
      {spec.supportsModelList && (
        <ModelField
          model={draft.model}
          placeholder={MODEL_PLACEHOLDERS[spec.providerType]}
          models={models.list}
          useSelect={models.list.length > 0 && !draft.modelFreeText}
          fetching={models.fetching}
          error={models.error}
          onSelect={actions.selectModel}
          onChange={actions.setModel}
        />
      )}
      {spec.value === 'vercel-ai-sdk' && (
        <div className="provider-dialog__hint">{t('userAiSettings:vercelAiSdkHint')}</div>
      )}
      <TestRow
        result={account && testText !== null ? { ok: account.ok, text: testText } : null}
        testing={testing}
        canTest={view.canTest}
        onTest={actions.runTest}
      />
    </>
  )
}
