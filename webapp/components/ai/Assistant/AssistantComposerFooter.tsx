import React from 'react'

import { TestId } from '@webapp/utils/testId'

import type { AssistantArea } from './assistantAreas'
import { AssistantContextUsage } from './AssistantContextMeter'
import type { ContextMeter } from './contextMeterModel'
import { AssistantSentDataChip } from './AssistantSentDataChip'
import { AssistantProviderChip } from './providerChip/AssistantProviderChip'
import type { AssistantConversationApi } from './useAssistantConversation'

/**
 * Footer of the composer: the provider that answers, what is sent, the context used, then Send or Stop (children).
 * @param {object} props - Props.
 * @param {AssistantArea} props.area - Current area.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @param {ContextMeter|null} props.contextMeter - Meter of the shown conversation (computed once by the chat).
 * @param {React.ReactNode} [props.children] - Send or Stop button, on the right.
 * @returns {React.ReactElement} The footer.
 */
export const AssistantComposerFooter = ({
  area,
  api,
  contextMeter,
  children,
}: {
  area: AssistantArea
  api: AssistantConversationApi
  contextMeter: ContextMeter | null
  children?: React.ReactNode
}) => (
  <div className="ai-assistant-panel__composer-footer" data-testid={TestId.aiAssistant.composerFooter}>
    <AssistantProviderChip
      area={area}
      conversation={api.conversation}
      disabled={api.busy || api.applying}
      onChoose={api.chooseProvider}
      onOpenChange={api.setProviderChooserOpen}
      open={api.providerChooserOpen}
      providerId={api.providerId}
    />
    <AssistantSentDataChip area={area} conversation={api.conversation} />
    <AssistantContextUsage meter={contextMeter} />
    <span className="ai-assistant-panel__composer-spacer" />
    {children}
  </div>
)
