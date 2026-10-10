import React from 'react'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { type AiEnginePill, type AiEngineStatus, getAiEngineStatusText } from './aiEngineStatus'
import { toT } from './aiSettingsForm'
import { StatusPill, type StatusPillTone } from './StatusPill'

const PILL_TONES: Record<AiEnginePill, StatusPillTone> = { ready: 'ok', notTested: 'warn', notAvailable: 'bad' }

type Props = {
  status: AiEngineStatus
}

/**
 * "Now:" line of Where AI runs: where a schema request would go, and whether that engine works.
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The line.
 */
export const AiEngineStatusLine = ({ status }: Props) => {
  const i18n = useI18n()
  const t = toT(i18n)
  return (
    // a live region: a screen reader announces when the engine or its state changes
    <div
      className="user-ai-settings-panel__status-line"
      role="status"
      aria-atomic="true"
      data-testid={TestId.ai.engineStatus}
    >
      <span className="user-ai-settings-panel__status-label">{t('userAiSettings:status.now')}</span>
      <span>{getAiEngineStatusText({ status, t })}</span>
      <StatusPill tone={PILL_TONES[status.pill]} text={t(`userAiSettings:status.${status.pill}`)} />
    </div>
  )
}
