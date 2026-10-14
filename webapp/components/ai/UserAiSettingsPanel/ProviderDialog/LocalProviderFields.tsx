import React from 'react'

import type { LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import { getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'
import { getAiErrorMessage } from '@webapp/ai/runtime/runtimeErrors'
import { Button as ButtonJS } from '@webapp/components/buttons'
import { FormItem, Input as InputJS } from '@webapp/components/form/Input'
import { Spinner } from '@webapp/components/Spinner'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { StatusPill } from '../StatusPill'
import type { ProviderDialogApi } from './useProviderDialog'

// forwardRef components lose their prop types in TS (same cast as the panel)
const Input = InputJS as React.ComponentType<any>
const Button = ButtonJS as React.ComponentType<any>

type Props = {
  dialog: ProviderDialogApi
}

/**
 * "Answered" pill with the data location, the context size and the no-model warning.
 * @param {object} props - Props.
 * @param {LocalServerTestView} props.view - A reachable result.
 * @param {ProviderDialogApi} props.dialog - Dialog API.
 * @returns {React.ReactElement} The lines.
 */
const LocalAnswered = ({ view, dialog }: { view: LocalServerTestView; dialog: ProviderDialogApi }) => {
  const { t } = dialog
  const location = getAiDataLocationText({
    location: { hostingClass: view.hostingClass, provider: null, model: null, engine: null },
    t,
  })
  const text = [t('userAiSettings:localServer.answered'), location].filter(Boolean).join(' · ')
  return (
    <>
      <StatusPill tone="ok" text={text} testId={TestId.ai.providerTestResult} />
      <span className="provider-dialog__hint">
        {view.contextTokens
          ? t('userAiSettings:localServer.contextTokens', { count: view.contextTokens })
          : t('userAiSettings:localServer.contextUnknown')}
      </span>
      {view.models.length === 0 && (
        <span className="provider-dialog__hint provider-dialog__hint--warning">
          {t('userAiSettings:localServer.noModels')}
        </span>
      )}
    </>
  )
}

/**
 * Result of the local test (or of the app's last probe of the saved server).
 * @param {Props} props - Props.
 * @returns {React.ReactElement|null} The result.
 */
const LocalTestResult = ({ dialog }: Props) => {
  const i18n = useI18n()
  const view = dialog.test?.local
  if (!view) return null
  const { t } = dialog
  return (
    <div className="provider-dialog__result">
      {view.reachable ? (
        <LocalAnswered view={view} dialog={dialog} />
      ) : (
        <StatusPill
          tone="bad"
          text={getAiErrorMessage({ error: view.error, i18n })}
          testId={TestId.ai.providerTestResult}
        />
      )}
      {view.showHttpsHint && <span className="provider-dialog__hint">{t('userAiSettings:localServer.httpsHint')}</span>}
      {view.showCloudWarning && (
        <span className="provider-dialog__hint provider-dialog__hint--warning">
          {t('userAiSettings:localServer.cloudWarning')}
        </span>
      )}
    </div>
  )
}

/**
 * Step 2 for a Local server: URL with Test, the result, the Model select and the setup help.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The fields.
 */
export const LocalProviderFields = ({ dialog }: Props) => {
  const { t, draft, testing } = dialog
  return (
    <>
      <FormItem label="userAiSettings:localServer.baseUrl">
        <div className="provider-dialog__row">
          <Input
            value={draft.baseUrl}
            id={TestId.ai.providerBaseUrl}
            onChange={dialog.setBaseUrl}
            placeholder={dialog.spec.value === 'local' ? 'http://localhost:1234/v1' : undefined}
          />
          <Button
            variant="outlined"
            label="userAiSettings:dialog.test"
            onClick={dialog.runTest}
            disabled={!dialog.canTest}
            icon={testing ? <Spinner size={16} /> : null}
            testId={TestId.ai.providerTest}
          />
        </div>
      </FormItem>
      {/* always rendered, so a screen reader announces the result when it appears */}
      <div role="status" className="provider-dialog__live">
        <LocalTestResult dialog={dialog} />
      </div>
      <FormItem label="userAiSettings:localServer.model">
        <select
          className="provider-dialog__select"
          aria-label={t('userAiSettings:localServer.model')}
          value={draft.model}
          onChange={(event) => dialog.setModel(event.target.value)}
          data-testid={TestId.ai.providerModel}
        >
          <option value="">{t('userAiSettings:localServer.modelPlaceholder')}</option>
          {dialog.localModels.map((modelId) => (
            <option key={modelId} value={modelId}>
              {modelId}
            </option>
          ))}
        </select>
      </FormItem>
      <div className="provider-dialog__hint">{t('userAiSettings:localServer.help')}</div>
    </>
  )
}
