import React, { useEffect, useRef, useState } from 'react'

import { AiLimits } from '@common/ai/limits'

import { assistantAreaFeatures } from '@webapp/ai/agent/runAssistantTurn'
import { getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'
import { Button } from '@webapp/components/buttons'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type { AssistantArea } from './assistantAreas'
import { assistantPanelStore } from './assistantPanelStore'
import { RecordDataNotice } from './analysis/RecordDataNotice'
import { useRecordDataNotice } from './analysis/useAnalysisArea'
import { AssistantComposerFooter } from './AssistantComposerFooter'
import { AssistantContextNotice } from './AssistantContextMeter'
import { AssistantConversationBar } from './AssistantConversationBar'
import { AssistantMessageView } from './AssistantMessage'
import { usePendingSuggestionRequest } from './suggestions/usePendingSuggestionRequest'
import { useAssistantPanel } from './useAssistantPanel'
import type { AssistantConversationApi } from './useAssistantConversation'

/**
 * Messages and composer of the current conversation; blank until the first message of a new one.
 * @param {object} props - Props.
 * @param {AssistantArea} props.area - Current area.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement} The chat.
 */
export const AssistantChat = ({ area, api }: { area: AssistantArea; api: AssistantConversationApi }) => {
  const t = useI18nT({ unescapeHtml: true })
  const [input, setInput] = useState('')
  const { draft: panelDraft, draftArea, conversationId } = useAssistantPanel()
  const draft = draftArea === area ? panelDraft : null
  const [appliedDraft, setAppliedDraft] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const { conversation, busy, applying, engineNotice } = api
  // null while a remembered conversation loads (no "new conversation" title flash)
  const barTitle = conversation?.title ?? (conversationId ? null : '')
  const messages = conversation?.messages ?? []
  const lastId = messages.at(-1)?.id
  const recordDataNotice = useRecordDataNotice(conversation, assistantAreaFeatures[area])
  // Do it on a card of this area: sent here once the conversation hook is ready
  usePendingSuggestionRequest({ api, area })

  // a composer text set by "Ask the assistant": shown for the user to send, never sent by itself
  if (draft !== appliedDraft) {
    setAppliedDraft(draft)
    if (draft !== null) setInput(draft)
  }
  useEffect(() => {
    if (draft !== null) assistantPanelStore.clearDraft()
  }, [draft])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [conversation])

  /**
   * Sends the typed message.
   * @returns {void} Nothing.
   */
  const onSend = () => {
    const text = input.trim()
    if (!text || busy || applying) return
    setInput('')
    void api.send(text)
  }

  /**
   * Enter sends, Shift+Enter adds a line.
   * @param {React.KeyboardEvent<HTMLTextAreaElement>} event - Key event.
   * @returns {void} Nothing.
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    onSend()
  }

  return (
    <>
      {!api.persistent && (
        <div className="ai-assistant-panel__notice" data-testid={TestId.aiAssistant.inMemoryOnly}>
          {t('aiAssistant.inMemoryOnly')}
        </div>
      )}
      <AssistantConversationBar busy={busy} title={barTitle} />
      <div aria-live="polite" className="ai-assistant-panel__messages" ref={listRef}>
        {messages.map((message) => (
          <AssistantMessageView
            api={api}
            area={area}
            changeSets={conversation?.changeSets ?? {}}
            isLast={message.id === lastId}
            key={message.id}
            message={message}
            queries={conversation?.queries ?? {}}
          />
        ))}
      </div>
      {engineNotice && (
        <div className="ai-assistant-panel__engine-notice" data-testid={TestId.ai.engineNotice}>
          {t('aiEngine.nowUsing', { location: getAiDataLocationText({ location: engineNotice, t }) })}
        </div>
      )}
      <AssistantContextNotice busy={busy} conversation={conversation} onNewConversation={api.newConversation} />
      <div className="ai-assistant-panel__composer">
        {recordDataNotice ? (
          <RecordDataNotice onNewConversation={api.newConversation} />
        ) : (
          <textarea
            aria-label={t('aiAssistant.placeholder')}
            data-testid={TestId.aiAssistant.input}
            maxLength={AiLimits.assistantMessageMaxChars}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('aiAssistant.placeholder')}
            rows={2}
            value={input}
          />
        )}
        <AssistantComposerFooter area={area} conversation={conversation}>
          {!recordDataNotice && busy && (
            <Button
              label="aiAssistant.stop"
              onClick={api.stop}
              size="small"
              testId={TestId.aiAssistant.stopBtn}
              variant="text"
            />
          )}
          {!recordDataNotice && !busy && (
            <Button
              className="ai-assistant-panel__send"
              disabled={!input.trim() || applying}
              iconClassName="icon-arrow-up2 icon-14px"
              label="aiAssistant.send"
              onClick={onSend}
              primary
              showLabel={false}
              size="small"
              testId={TestId.aiAssistant.sendBtn}
            />
          )}
        </AssistantComposerFooter>
      </div>
    </>
  )
}
