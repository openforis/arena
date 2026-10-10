import React, { useEffect, useRef } from 'react'

import type { LocalServerTestView } from '@webapp/ai/engines/localServerTest'
import { getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'
import { getAiErrorMessage } from '@webapp/ai/runtime/runtimeErrors'
import { Button as ButtonJS } from '@webapp/components/buttons'
import { Checkbox } from '@webapp/components/form'
import { FormItem, Input as InputJS } from '@webapp/components/form/Input'
import { Spinner } from '@webapp/components/Spinner'
import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { toT } from './aiSettingsForm'
import { StatusPill } from './StatusPill'
import type { LocalServerDraftApi } from './useLocalServerDraft'

// forwardRef JS components lose their prop types in TS (same cast as UserAiSettingsPanel)
const Input = InputJS as React.ComponentType<any>
const Button = ButtonJS as React.ComponentType<any>

const LM_STUDIO_DOCS_URL = 'https://lmstudio.ai/docs'

type Props = {
  local: LocalServerDraftApi
}

/**
 * "Answered" pill with the data location, the context size and the no-model warning.
 * @param {object} props - Props.
 * @param {LocalServerTestView} props.testView - A reachable result.
 * @returns {React.ReactElement} The lines.
 */
const LocalAnswered = ({ testView }: { testView: LocalServerTestView }) => {
  const i18n = useI18n()
  const t = toT(i18n)
  const location = getAiDataLocationText({
    location: { hostingClass: testView.hostingClass, provider: null, model: null, engine: null },
    t,
  })
  const text = [t('userAiSettings:localServer.answered'), location].filter(Boolean).join(' · ')
  return (
    <>
      <StatusPill tone="ok" text={text} />
      <span className="user-ai-settings-panel__hint">
        {testView.contextTokens
          ? t('userAiSettings:localServer.contextTokens', { count: testView.contextTokens })
          : t('userAiSettings:localServer.contextUnknown')}
      </span>
      {testView.models.length === 0 && (
        <span className="user-ai-settings-panel__hint user-ai-settings-panel__hint--warning">
          {t('userAiSettings:localServer.noModels')}
        </span>
      )}
    </>
  )
}

/**
 * Result of the Test (or of the app's probe of the saved server).
 * @param {object} props - Props.
 * @param {LocalServerTestView|null} props.testView - Result, null when the URL was not tested.
 * @returns {React.ReactElement|null} The result.
 */
const LocalTestResult = ({ testView }: { testView: LocalServerTestView | null }) => {
  const i18n = useI18n()
  if (!testView) return null
  const t = toT(i18n)
  return (
    <div className="user-ai-settings-panel__result" data-testid={TestId.ai.localServerTestResult}>
      {testView.reachable ? (
        <LocalAnswered testView={testView} />
      ) : (
        <StatusPill tone="bad" text={getAiErrorMessage({ error: testView.error, i18n })} />
      )}
      {testView.showHttpsHint && (
        <span className="user-ai-settings-panel__hint">{t('userAiSettings:localServer.httpsHint')}</span>
      )}
      {testView.showCloudWarning && (
        <span className="user-ai-settings-panel__hint user-ai-settings-panel__hint--warning">
          {t('userAiSettings:localServer.cloudWarning')}
        </span>
      )}
    </div>
  )
}

/**
 * Server URL with Test, the result, the Model select and the LM Studio hint.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The body.
 */
const LocalServerBody = ({ local }: Props) => {
  const i18n = useI18n()
  const t = toT(i18n)
  const { draft, testing, testView, models } = local
  return (
    <>
      <FormItem label="userAiSettings:localServer.baseUrl">
        <div className="user-ai-settings-panel__row">
          <Input
            value={draft.baseUrl}
            id={TestId.ai.localServerBaseUrl}
            onChange={local.setBaseUrl}
            onBlur={local.commitBaseUrl}
          />
          <Button
            variant="outlined"
            label="userAiSettings:localServer.test"
            onClick={local.runTest}
            disabled={testing}
            icon={testing ? <Spinner size={16} /> : null}
            testId={TestId.ai.localServerTest}
          />
        </div>
      </FormItem>
      <LocalTestResult testView={testView} />
      <FormItem label="userAiSettings:localServer.model">
        <select
          className="user-ai-settings-panel__select"
          value={draft.modelId ?? ''}
          onChange={(event) => local.setModelId(event.target.value || null)}
          data-testid={TestId.ai.localServerModel}
        >
          <option value="">{t('userAiSettings:localServer.modelPlaceholder')}</option>
          {models.map((modelId) => (
            <option key={modelId} value={modelId}>
              {modelId}
            </option>
          ))}
        </select>
      </FormItem>
      <div className="user-ai-settings-panel__hint">
        {t('userAiSettings:localServer.help')}{' '}
        <a href={LM_STUDIO_DOCS_URL} target="_blank" rel="noopener noreferrer">
          {t('userAiSettings:localServer.docsLink')}
        </a>
      </div>
    </>
  )
}

/**
 * Local AI server block (this browser only): edits the draft, the profile Save writes it.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The block.
 */
export const LocalAiSection = ({ local }: Props) => {
  const i18n = useI18n()
  const blockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (local.focusRequest === 0) return
    const block = blockRef.current
    block?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // this effect runs after the render that shows the body (Use was ticked)
    block?.querySelector<HTMLInputElement>(`input[data-testid="${TestId.ai.localServerBaseUrl}"]`)?.focus({
      preventScroll: true,
    })
  }, [local.focusRequest])

  return (
    <div className="user-ai-settings-panel__engine" ref={blockRef}>
      <div className="user-ai-settings-panel__engine-header">
        <span className="user-ai-settings-panel__engine-name">{i18n.t('userAiSettings:localServer.name')}</span>
        <span className="user-ai-settings-panel__engine-where">{i18n.t('userAiSettings:localServer.where')}</span>
        <span className="user-ai-settings-panel__spacer" />
        <Checkbox
          checked={local.draft.enabled}
          onChange={local.setEnabled}
          label="userAiSettings:localServer.use"
          testId={TestId.ai.localServerEnabled}
        />
      </div>
      {local.draft.enabled && <LocalServerBody local={local} />}
    </div>
  )
}
