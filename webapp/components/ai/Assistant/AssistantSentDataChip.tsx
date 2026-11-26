import type { Conversation } from '@webapp/ai/conversations/types'
import { AppIcon, IconName } from '@webapp/components/AppIcon'
import { TooltipNew } from '@webapp/components/TooltipNew'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type { AssistantArea } from './assistantAreas'
import { getSentDataLevel, type SentDataLevel } from './sentDataLevel'

const levelIcons: Record<SentDataLevel, IconName> = {
  questions: 'chat',
  schema: 'tree',
  data: 'database',
}

/**
 * Chip of the composer footer: the level of content the conversation sends (questions, survey design, record data).
 * @param {object} props - Props.
 * @param {Conversation|null} props.conversation - Open conversation (null before the first message).
 * @returns {React.ReactElement} The chip.
 */
export const AssistantSentDataChip = ({
  area,
  conversation,
}: {
  area: AssistantArea
  conversation: Conversation | null
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const level = getSentDataLevel({ area, conversation })
  const label = t(`aiAssistant.sentData.${level}.label`)
  return (
    <TooltipNew title={`aiAssistant.sentData.${level}.tooltip`}>
      {/* a button (toggletip): focusable, so the tooltip opens from the keyboard too */}
      <button
        aria-label={t('aiAssistant.sentData.ariaLabel', { label })}
        className={`ai-assistant-panel__sent-data ai-assistant-panel__sent-data--${level}`}
        data-level={level}
        data-testid={TestId.aiAssistant.sentDataChip}
        type="button"
      >
        <AppIcon name={levelIcons[level]} size={16} />
        <span aria-hidden="true" className="ai-assistant-panel__sent-data-text">
          {label}
        </span>
      </button>
    </TooltipNew>
  )
}
