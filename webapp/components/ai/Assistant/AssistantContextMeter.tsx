import React from 'react'

import type { Conversation } from '@webapp/ai/conversations/types'
import { Button } from '@webapp/components/buttons'
import { TooltipNew } from '@webapp/components/TooltipNew'
import { useI18nT, useLang } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import {
  buildContextMeter,
  CONTEXT_RING_RADIUS,
  getContextMeterShortText,
  getContextMeterText,
  getContextRingDashArray,
  type ContextMeter,
} from './contextMeterModel'

/**
 * Returns the meter of the shown conversation.
 * @param {Conversation|null} conversation - Shown conversation.
 * @returns {ContextMeter|null} The meter; null before the first answer with a usage.
 */
const useContextMeter = (conversation: Conversation | null): ContextMeter | null => {
  const lang: string = useLang()
  return buildContextMeter({ messages: conversation?.messages ?? [], lang })
}

/**
 * Context ring of the composer footer: fills with the tokens the conversation used at the latest answer, against the
 * model's window when it is known (local server); dashed and empty when the window is unknown (cloud). The tokens are
 * in its tooltip. Hidden before the first answer.
 * @param {object} props - Props.
 * @param {Conversation|null} props.conversation - Shown conversation.
 * @returns {React.ReactElement|null} The ring.
 */
export const AssistantContextRing = ({ conversation }: { conversation: Conversation | null }) => {
  const t = useI18nT({ unescapeHtml: true })
  const meter = useContextMeter(conversation)
  if (!meter) return null
  const text = getContextMeterText({ meter, t })
  const dashArray = getContextRingDashArray(meter.ratio)
  const label = `${t('aiAssistant.context.label')}: ${text}`
  // a meter when the window is known; otherwise only the tokens used
  const roleProps =
    meter.windowTokens !== null && dashArray !== null
      ? {
          role: 'meter',
          'aria-valuemin': 0,
          'aria-valuemax': meter.windowTokens,
          'aria-valuenow': meter.barValue ?? 0,
          'aria-valuetext': text,
        }
      : { role: 'img' }
  return (
    <TooltipNew renderTitle={() => text}>
      <span
        {...roleProps}
        aria-label={label}
        className="ai-assistant-panel__context-ring"
        data-level={meter.level}
        data-testid={TestId.aiAssistant.contextMeter}
        // focusable, so the tooltip opens from the keyboard too
        tabIndex={0}
      >
        <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20">
          <circle
            className={`ai-assistant-panel__context-ring-track${dashArray === null ? ' ai-assistant-panel__context-ring-track--unknown' : ''}`}
            cx="10"
            cy="10"
            r={CONTEXT_RING_RADIUS}
          />
          {dashArray !== null && (
            <circle
              className={`ai-assistant-panel__context-ring-fill ai-assistant-panel__context-ring-fill--${meter.level}`}
              cx="10"
              cy="10"
              r={CONTEXT_RING_RADIUS}
              strokeDasharray={dashArray}
            />
          )}
        </svg>
      </span>
    </TooltipNew>
  )
}

/**
 * What the ring can't say, above the composer: near the window's limit (with New conversation) and the older messages
 * no longer sent. Hidden when neither applies.
 * @param {object} props - Props.
 * @param {Conversation|null} props.conversation - Shown conversation.
 * @param {Function} props.onNewConversation - Starts a new conversation in the area.
 * @param {boolean} [props.busy] - An answer is running (New conversation is disabled, as in the menu).
 * @returns {React.ReactElement|null} The notice.
 */
export const AssistantContextNotice = ({
  conversation,
  onNewConversation,
  busy = false,
}: {
  conversation: Conversation | null
  onNewConversation: () => void
  busy?: boolean
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const meter = useContextMeter(conversation)
  if (!meter || (meter.level === 'normal' && !meter.historyTrimmed)) return null
  return (
    <div
      className="ai-assistant-panel__context"
      data-level={meter.level}
      data-testid={TestId.aiAssistant.contextNotice}
    >
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

/**
 * Context ring of the composer footer with its short text ("12K / 128K"). Hidden before the first answer.
 * @param {object} props - Props.
 * @param {Conversation|null} props.conversation - Shown conversation.
 * @returns {React.ReactElement|null} The ring and its text.
 */
export const AssistantContextUsage = ({ conversation }: { conversation: Conversation | null }) => {
  const meter = useContextMeter(conversation)
  if (!meter) return null
  return (
    <span className="ai-assistant-panel__context-usage">
      <AssistantContextRing conversation={conversation} />
      {/* the ring's label and tooltip carry the full text */}
      <span aria-hidden="true" className="ai-assistant-panel__context-text">
        {getContextMeterShortText(meter)}
      </span>
    </span>
  )
}
