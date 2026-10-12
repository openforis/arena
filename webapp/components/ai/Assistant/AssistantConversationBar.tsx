import React from 'react'

import { Button } from '@webapp/components/buttons'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { assistantPanelStore } from './assistantPanelStore'

/**
 * Bar above a conversation: back to the home page, then the conversation's title.
 * @param {object} props - Props.
 * @param {string|null} props.title - Conversation title: empty until it has one, null while it loads.
 * @param {boolean} props.busy - An answer is running (the conversation can't be left).
 * @returns {React.ReactElement} The bar.
 */
export const AssistantConversationBar = ({ title, busy }: { title: string | null; busy: boolean }) => {
  const t = useI18nT()
  const shownTitle = title === null ? '' : title || t('aiAssistant.newConversationTitle')
  return (
    <div className="ai-assistant-panel__bar" data-testid={TestId.aiAssistant.conversationBar}>
      <Button
        disabled={busy}
        iconClassName="icon-arrow-left2 icon-12px"
        label="aiAssistant.back"
        onClick={assistantPanelStore.showHome}
        showLabel={false}
        size="small"
        testId={TestId.aiAssistant.conversationBackBtn}
        variant="text"
      />
      <h3
        className={`ai-assistant-panel__bar-title${title ? '' : ' ai-assistant-panel__bar-title--untitled'}`}
        title={shownTitle}
      >
        {shownTitle}
      </h3>
    </div>
  )
}
