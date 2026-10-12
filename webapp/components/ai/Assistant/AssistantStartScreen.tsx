import React, { useEffect } from 'react'

import type { AssistantSuggestion } from '@webapp/ai/suggestions/types'
import { Button } from '@webapp/components/buttons'
import { useI18nT, useLang } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type { AssistantArea } from './assistantAreas'
import { assistantPanelStore } from './assistantPanelStore'
import { formatConversationTime, START_SCREEN_RECENT_COUNT } from './conversationListModel'
import { AssistantSuggestions } from './suggestions/AssistantSuggestions'
import type { AssistantConversationApi } from './useAssistantConversation'

const areaIntroKeys: Record<AssistantArea, string> = {
  design: 'aiAssistant.emptyDesign',
  analysis: 'aiAnalysis.empty',
  cleaning: 'aiCleaning.empty',
  help: 'aiAssistant.emptyHelp',
}

/**
 * Home page of an area: its first suggestions, then its latest conversations (the area's intro when there are
 * neither), and the button that starts a new conversation.
 * @param {object} props - Props.
 * @param {AssistantArea} props.area - Current area.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @param {AssistantSuggestion[]} props.suggestions - Visible suggestions of the area.
 * @returns {React.ReactElement} The start screen.
 */
export const AssistantStartScreen = ({
  area,
  api,
  suggestions,
}: {
  area: AssistantArea
  api: AssistantConversationApi
  suggestions: AssistantSuggestion[]
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const lang: string = useLang()
  const { history, loadHistory, openConversation } = api

  // runs again when the area (or the store) changes: loadHistory depends on them
  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const now = new Date()
  const recent = history.slice(0, START_SCREEN_RECENT_COUNT)
  return (
    <div className="ai-assistant-panel__home" data-testid={TestId.aiAssistant.startScreen}>
      <div className="ai-assistant-panel__start">
        <AssistantSuggestions
          api={api}
          heading={t('aiAssistant.start.suggestions')}
          startScreen
          suggestions={suggestions}
        />
        {recent.length > 0 && (
          <section>
            <h3 className="ai-assistant-panel__section-title">{t('aiAssistant.start.recent')}</h3>
            <ul className="ai-assistant-panel__recent">
              {recent.map((item) => (
                <li key={item.id}>
                  <button
                    className="ai-assistant-panel__recent-item"
                    data-testid={TestId.aiAssistant.recentItem}
                    onClick={() => openConversation(item.id)}
                    title={item.title || t('aiAssistant.newConversationTitle')}
                    type="button"
                  >
                    <span aria-hidden="true" className="icon icon-bubble icon-12px" />
                    <span className="ai-assistant-panel__history-title">
                      {item.title || t('aiAssistant.newConversationTitle')}
                    </span>
                    <time dateTime={item.updatedAt}>
                      {formatConversationTime({ updatedAt: item.updatedAt, now, lang })}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
            {/* always: the list is where a conversation is searched or deleted */}
            {history.length > 0 && (
              <Button
                label="aiAssistant.start.seeAll"
                labelParams={{ count: history.length }}
                onClick={assistantPanelStore.showHistory}
                size="small"
                testId={TestId.aiAssistant.seeAllBtn}
                variant="text"
              />
            )}
          </section>
        )}
        {suggestions.length === 0 && recent.length === 0 && (
          <p className="ai-assistant-panel__empty">{t(areaIntroKeys[area])}</p>
        )}
      </div>
      <div className="ai-assistant-panel__home-footer">
        <Button
          className="ai-assistant-panel__home-new"
          disabled={api.busy}
          iconClassName="icon-plus icon-12px"
          label="aiAssistant.menu.newConversation"
          onClick={api.newConversation}
          primary
          testId={TestId.aiAssistant.homeNewConversationBtn}
        />
      </div>
    </div>
  )
}
