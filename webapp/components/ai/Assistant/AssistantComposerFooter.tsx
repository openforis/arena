import React from 'react'

import { assistantAreaFeatures } from '@webapp/ai/agent/runAssistantTurn'
import { getConversationDataClass } from '@webapp/ai/conversations/dataClass'
import type { Conversation } from '@webapp/ai/conversations/types'
import { AiFeatureDataLocationBadge } from '@webapp/components/ai/AiDataLocationBadge'
import { TestId } from '@webapp/utils/testId'

import type { AssistantArea } from './assistantAreas'
import { AssistantContextUsage } from './AssistantContextMeter'
import { AssistantSentDataChip } from './AssistantSentDataChip'

/**
 * Footer of the composer: where the data goes, what is sent, the context used, then Send or Stop (children).
 * @param {object} props - Props.
 * @param {AssistantArea} props.area - Current area.
 * @param {Conversation|null} props.conversation - Open conversation.
 * @param {React.ReactNode} [props.children] - Send or Stop button, on the right.
 * @returns {React.ReactElement} The footer.
 */
export const AssistantComposerFooter = ({
  area,
  conversation,
  children,
}: {
  area: AssistantArea
  conversation: Conversation | null
  children?: React.ReactNode
}) => (
  <div className="ai-assistant-panel__composer-footer" data-testid={TestId.aiAssistant.composerFooter}>
    <AiFeatureDataLocationBadge
      dataClass={area === 'analysis' ? getConversationDataClass(conversation) : undefined}
      feature={assistantAreaFeatures[area]}
    />
    <AssistantSentDataChip area={area} conversation={conversation} />
    <AssistantContextUsage conversation={conversation} />
    <span className="ai-assistant-panel__composer-spacer" />
    {children}
  </div>
)
