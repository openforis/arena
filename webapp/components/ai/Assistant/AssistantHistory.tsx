import React, { useEffect } from 'react'

import { Button } from '@webapp/components/buttons'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { assistantPanelStore } from './assistantPanelStore'
import type { AssistantConversationApi } from './useAssistantConversation'

/**
 * Saved conversations of the area in the current survey, newest first.
 * @param {object} props - Props.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement} The history.
 */
export const AssistantHistory = ({ api }: { api: AssistantConversationApi }) => {
  const t = useI18nT({ unescapeHtml: true })
  const { history, loadHistory, openConversation } = api

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  return (
    <div className="ai-assistant-panel__history" data-testid={TestId.aiAssistant.history}>
      <div className="ai-assistant-panel__history-header">
        <Button label="aiAssistant.back" onClick={assistantPanelStore.showChat} size="small" variant="text" />
        <h3>{t('aiAssistant.historyTitle')}</h3>
      </div>
      {history.length === 0 ? (
        <p className="ai-assistant-panel__empty">{t('aiAssistant.historyEmpty')}</p>
      ) : (
        <ul className="ai-assistant-panel__history-list">
          {history.map((item) => (
            <li key={item.id}>
              <button
                className="ai-assistant-panel__history-item"
                data-testid={TestId.aiAssistant.historyItem}
                onClick={() => openConversation(item.id)}
                type="button"
              >
                <span>{item.title}</span>
                <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleString()}</time>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
