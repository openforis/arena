import React from 'react'

export type StatusPillTone = 'ok' | 'warn' | 'bad'

// an icon and a text with every colour, never colour alone
const ICONS: Record<StatusPillTone, string> = { ok: '✓', warn: '⚠', bad: '✗' }

type Props = {
  tone: StatusPillTone
  text: string
  testId?: string
}

/**
 * Status pill of the AI settings panel (engine status, Test results).
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The pill.
 */
export const StatusPill = ({ tone, text, testId }: Props) => (
  <span className={`user-ai-settings-panel__pill user-ai-settings-panel__pill--${tone}`} data-testid={testId}>
    <span aria-hidden="true">{ICONS[tone]}</span>
    <span>{text}</span>
  </span>
)
