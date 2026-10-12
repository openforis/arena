import React from 'react'

import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'
import { Button } from '@webapp/components/buttons'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { assistantPanelStore } from './assistantPanelStore'
import { AssistantSuggestions } from './suggestions/AssistantSuggestions'
import type { AssistantConversationApi } from './useAssistantConversation'

/**
 * Every suggestion of the area ("See all" on the home page).
 * @param {object} props - Props.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @param {AssistantSuggestion[]} props.suggestions - Visible suggestions of the area.
 * @returns {React.ReactElement} The list.
 */
export const AssistantSuggestionList = ({
  api,
  suggestions,
}: {
  api: AssistantConversationApi
  suggestions: AssistantSuggestion[]
}) => {
  const t = useI18nT({ unescapeHtml: true })
  return (
    <div className="ai-assistant-panel__history" data-testid={TestId.aiAssistant.suggestionList}>
      <div className="ai-assistant-panel__bar">
        <Button
          iconClassName="icon-arrow-left2 icon-12px"
          label="aiAssistant.back"
          onClick={assistantPanelStore.showHome}
          showLabel={false}
          size="small"
          testId={TestId.aiAssistant.suggestionListBackBtn}
          variant="text"
        />
        <h3 className="ai-assistant-panel__bar-title">{t('aiAssistant.start.suggestions')}</h3>
      </div>
      <div className="ai-assistant-panel__history-body">
        {suggestions.length === 0 && <p className="ai-assistant-panel__empty">{t('aiAssistant.noSuggestions')}</p>}
        <AssistantSuggestions api={api} suggestions={suggestions} />
      </div>
    </div>
  )
}
