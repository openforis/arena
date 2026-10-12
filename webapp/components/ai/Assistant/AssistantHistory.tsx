import React, { useEffect, useState } from 'react'

import { AiLimits } from '@common/ai/limits'

import type { Conversation } from '@webapp/ai/conversations/types'
import { Button, ButtonIconDelete } from '@webapp/components/buttons'
import { useI18nT, useLang } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { assistantPanelStore } from './assistantPanelStore'
import { filterConversations, formatConversationTime, groupConversationsByDay } from './conversationListModel'
import type { AssistantConversationApi } from './useAssistantConversation'
import { useAssistantPanel } from './useAssistantPanel'

type RowProps = {
  item: Conversation
  // the item's title, or the "new conversation" one while it has none
  title: string
  current: boolean
  time: string
  busy: boolean
  onOpen: (id: string) => void
  onDelete: (id: string) => Promise<void>
}

/**
 * One conversation of the list: opens it, or deletes it (the button shows on hover and focus).
 * @param {RowProps} props - Props.
 * @returns {React.ReactElement} The row.
 */
const HistoryRow = ({ item, title, current, time, busy, onOpen, onDelete }: RowProps) => (
  <li className="ai-assistant-panel__history-row">
    <button
      aria-current={current ? 'true' : undefined}
      className="ai-assistant-panel__history-item"
      data-testid={TestId.aiAssistant.historyItem}
      onClick={() => onOpen(item.id)}
      title={title}
      type="button"
    >
      <span className="ai-assistant-panel__history-title">{title}</span>
      <time dateTime={item.updatedAt}>{time}</time>
    </button>
    <ButtonIconDelete
      className="ai-assistant-panel__history-delete"
      disabled={busy}
      label="aiAssistant.deleteConversation"
      // a failed delete (store error) leaves the row in place: nothing else to show
      onClick={() => onDelete(item.id).catch(() => undefined)}
      testId={TestId.aiAssistant.historyDeleteBtn}
    />
  </li>
)

/**
 * Saved conversations of the area in the current survey: search, groups by day, open and delete.
 * @param {object} props - Props.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement} The list.
 */
export const AssistantHistory = ({ api }: { api: AssistantConversationApi }) => {
  const t = useI18nT({ unescapeHtml: true })
  const lang: string = useLang()
  const { conversationId } = useAssistantPanel()
  const { history, loadHistory, openConversation, deleteConversation, busy } = api
  const [query, setQuery] = useState('')

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const now = new Date()
  const groups = groupConversationsByDay({ conversations: filterConversations({ conversations: history, query }), now })

  return (
    <div className="ai-assistant-panel__history" data-testid={TestId.aiAssistant.history}>
      <div className="ai-assistant-panel__bar">
        <Button
          iconClassName="icon-arrow-left2 icon-12px"
          label="aiAssistant.back"
          onClick={assistantPanelStore.showHome}
          showLabel={false}
          size="small"
          testId={TestId.aiAssistant.historyBackBtn}
          variant="text"
        />
        <h3 className="ai-assistant-panel__bar-title">{t('aiAssistant.historyTitle')}</h3>
      </div>
      <div className="ai-assistant-panel__history-body">
        {history.length === 0 && <p className="ai-assistant-panel__empty">{t('aiAssistant.historyEmpty')}</p>}
        {history.length > 0 && (
          <input
            aria-label={t('aiAssistant.searchConversations')}
            className="ai-assistant-panel__history-search"
            data-testid={TestId.aiAssistant.historySearch}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('aiAssistant.searchConversations')}
            type="search"
            value={query}
          />
        )}
        {history.length > 0 && groups.length === 0 && (
          <p className="ai-assistant-panel__empty">{t('aiAssistant.historyNoMatch')}</p>
        )}
        {groups.map((group) => (
          <section className="ai-assistant-panel__history-group" key={group.key}>
            <h4 className="ai-assistant-panel__section-title">{t(`aiAssistant.day.${group.key}`)}</h4>
            <ul className="ai-assistant-panel__history-list">
              {group.items.map((item) => (
                <HistoryRow
                  busy={busy}
                  current={item.id === conversationId}
                  item={item}
                  key={item.id}
                  onDelete={deleteConversation}
                  onOpen={openConversation}
                  title={item.title || t('aiAssistant.newConversationTitle')}
                  time={formatConversationTime({ updatedAt: item.updatedAt, now, lang })}
                />
              ))}
            </ul>
          </section>
        ))}
        {api.persistent && (
          <p className="ai-assistant-panel__history-note" data-testid={TestId.aiAssistant.historyKept}>
            {t('aiAssistant.historyKept', { count: AiLimits.assistantConversationsKept })}
          </p>
        )}
      </div>
    </div>
  )
}
