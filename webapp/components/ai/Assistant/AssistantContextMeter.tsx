import React from 'react'

import type { Conversation } from '@webapp/ai/conversations/types'
import { Button } from '@webapp/components/buttons'
import { useI18nT, useLang } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { buildContextMeter, getContextMeterText } from './contextMeterModel'

/**
 * Context meter: the tokens the conversation used at the latest answer, against the model's window when it is known
 * (local server). Hidden before the first answer.
 * @param {object} props - Props.
 * @param {Conversation|null} props.conversation - Shown conversation.
 * @param {Function} props.onNewConversation - Starts a new conversation in the area.
 * @param {boolean} [props.busy] - An answer is running (New conversation is disabled, as in the menu).
 * @returns {React.ReactElement|null} The meter.
 */
export const AssistantContextMeter = ({
  conversation,
  onNewConversation,
  busy = false,
}: {
  conversation: Conversation | null
  onNewConversation: () => void
  busy?: boolean
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const lang: string = useLang()
  const meter = buildContextMeter({ messages: conversation?.messages ?? [], lang })
  if (!meter) return null
  const text = getContextMeterText({ meter, t })
  return (
    <div className="ai-assistant-panel__context" data-level={meter.level} data-testid={TestId.aiAssistant.contextMeter}>
      {meter.windowTokens !== null && meter.ratio !== null && (
        <div
          aria-label={t('aiAssistant.context.label')}
          aria-valuemax={meter.windowTokens}
          aria-valuemin={0}
          aria-valuenow={meter.barValue ?? 0}
          aria-valuetext={text}
          className="ai-assistant-panel__context-bar"
          role="meter"
        >
          <span
            className={`ai-assistant-panel__context-fill ai-assistant-panel__context-fill--${meter.level}`}
            style={{ width: `${Math.round(meter.ratio * 100)}%` }}
          />
        </div>
      )}
      <span>{text}</span>
      {meter.level !== 'normal' && (
        <span className="ai-assistant-panel__context-warning">
          {t('aiAssistant.context.nearLimit')}
          <Button
            disabled={busy}
            label="aiAssistant.menu.newConversation"
            onClick={onNewConversation}
            size="small"
            testId={TestId.aiAssistant.contextMeterNewConversationBtn}
            variant="text"
          />
        </span>
      )}
      {meter.historyTrimmed && (
        <p className="ai-assistant-panel__context-trimmed">{t('aiAssistant.context.trimmed')}</p>
      )}
    </div>
  )
}
