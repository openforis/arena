import React from 'react'

import { DEFAULT_LOCAL_SERVER_BASE_URL } from '@webapp/ai/engines/localServerSettings'
import type { LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import { getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'
import { getAiErrorMessage } from '@webapp/ai/runtime/runtimeErrors'
import { Button } from '@webapp/components/buttons'
import { FormItem, Input } from '@webapp/components/form/Input'
import { Spinner } from '@webapp/components/Spinner'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { StatusPill } from '../StatusPill'
import { useT } from '../useT'

/**
 * "Answered" pill with the data location, the context size and the no-model warning.
 * @param {object} props - Props.
 * @param {LocalServerTestView} props.view - A reachable result.
 * @returns {React.ReactElement} The lines.
 */
const LocalAnswered = ({ view }: { view: LocalServerTestView }) => {
  const t = useT()
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
 * @param {object} props - Props.
 * @param {LocalServerTestView|null} props.view - The result, null before a test.
 * @returns {React.ReactElement|null} The result.
 */
const LocalTestResult = ({ view }: { view: LocalServerTestView | null }) => {
  const i18n = useI18n()
  const t = useT()
  if (!view) return null
  return (
    <div className="provider-dialog__result">
      {view.reachable ? (
        <LocalAnswered view={view} />
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

type Props = {
  baseUrl: string
  model: string
  // the models of the server's answer, with the chosen one first when it is not listed
  models: string[]
  test: LocalServerTestView | null
  testing: boolean
  canTest: boolean
  onBaseUrlChange: (baseUrl: string) => void
  onModelChange: (model: string) => void
  onTest: () => void
}

/**
 * Step 2 for a Local server: URL with Test, the result, the Model select and the setup help.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The fields.
 */
export const LocalProviderFields = ({
  baseUrl,
  model,
  models,
  test,
  testing,
  canTest,
  onBaseUrlChange,
  onModelChange,
  onTest,
}: Props) => {
  const t = useT()
  return (
    <>
      <FormItem label="userAiSettings:localServer.baseUrl" htmlFor={TestId.ai.providerBaseUrl}>
        <div className="provider-dialog__row">
          <Input
            value={baseUrl}
            id={TestId.ai.providerBaseUrl}
            onChange={onBaseUrlChange}
            placeholder={DEFAULT_LOCAL_SERVER_BASE_URL}
          />
          <Button
            variant="outlined"
            label="userAiSettings:dialog.test"
            onClick={onTest}
            disabled={!canTest}
            icon={testing ? <Spinner size={16} /> : null}
            testId={TestId.ai.providerTest}
          />
        </div>
      </FormItem>
      {/* always rendered, so a screen reader announces the result when it appears */}
      <div role="status" className="provider-dialog__live">
        <LocalTestResult view={test} />
      </div>
      <FormItem label="userAiSettings:localServer.model" htmlFor={TestId.ai.providerModel}>
        <select
          id={TestId.ai.providerModel}
          className="provider-dialog__select"
          value={model}
          onChange={(event) => onModelChange(event.target.value)}
          data-testid={TestId.ai.providerModel}
        >
          <option value="">{t('userAiSettings:localServer.modelPlaceholder')}</option>
          {models.map((modelId) => (
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
