import React, { useEffect, useRef, useState } from 'react'

import { AiLimits } from '@common/ai/limits'

import * as User from '@core/user/user'

import { assistantAreaFeatures } from '@webapp/ai/agent/runAssistantTurn'
import { isCapabilitiesLoadedForUser } from '@webapp/ai/engines/capabilities'
import { getAiCapabilitiesStore } from '@webapp/ai/engines/capabilitiesStore'
import { Button } from '@webapp/components/buttons'
import { useAiCapabilities } from '@webapp/components/ai/hooks/useAiCapabilities'
import { useI18nT } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import type { AssistantArea } from './assistantAreas'
import { assistantPanelStore } from './assistantPanelStore'
import { RecordDataNotice } from './analysis/RecordDataNotice'
import { useRecordDataNotice } from './analysis/useAnalysisArea'
import { AssistantComposerFooter } from './AssistantComposerFooter'
import { AssistantContextNotice, useContextMeter } from './AssistantContextMeter'
import { isNearBottom } from './chatScrollModel'
import { AssistantConversationBar } from './AssistantConversationBar'
import { AssistantMessageView } from './AssistantMessage'
import { shouldShowProviderRemoved } from './providerChip/providerChipModel'
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
  const { conversation, busy, applying } = api
  const capabilities = useAiCapabilities()
  const user = useUser()
  const loaded = isCapabilitiesLoadedForUser(getAiCapabilitiesStore(), user ? (User.getUuid(user) ?? null) : null)
  // the conversation's provider was removed: the default answers, and the chat says so (only once the provider
  // list of this user is loaded: the empty snapshot before would flag every conversation)
  const providerRemoved = shouldShowProviderRemoved({ capabilities, loaded, providerId: api.providerId })
  // null while a remembered conversation loads (no "new conversation" title flash)
  const barTitle = conversation?.title ?? (conversationId ? null : '')
  const messages = conversation?.messages ?? []
  const lastId = messages.at(-1)?.id
  // computed once here and passed down (one per message otherwise)
  const recordDataNotice = useRecordDataNotice(conversation, assistantAreaFeatures[area], api.providerId)
  const contextMeter = useContextMeter(conversation)
  // the list follows a streaming answer only while the user is at its end (a read-up position is kept)
  const stickToBottomRef = useRef(true)
  const shownId = conversation?.id
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

  // another conversation starts at its end
  useEffect(() => {
    stickToBottomRef.current = true
  }, [shownId])

  useEffect(() => {
    const list = listRef.current
    if (list && stickToBottomRef.current) list.scrollTop = list.scrollHeight
  }, [conversation, shownId])

  /**
   * Remembers whether the user is reading the end of the list.
   * @param {React.UIEvent<HTMLDivElement>} event - Scroll event.
   * @returns {void} Nothing.
   */
  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    stickToBottomRef.current = isNearBottom(event.currentTarget)
  }

  /**
   * Sends the typed message.
   * @returns {void} Nothing.
   */
  const onSend = () => {
    const text = input.trim()
    if (!text || busy || applying) return
    setInput('')
    // the user's own message is shown at the end
    stickToBottomRef.current = true
    // nothing was sent (not ready): the text comes back instead of being lost
    void api.send(text).then((id) => {
      if (id === null) setInput((current) => current || text)
    })
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
      <div className="ai-assistant-panel__messages" onScroll={onScroll} ref={listRef}>
        {messages.map((message) => (
          <AssistantMessageView
            api={api}
            changeSets={conversation?.changeSets ?? {}}
            isLast={message.id === lastId}
            key={message.id}
            message={message}
            queries={conversation?.queries ?? {}}
            recordDataNotice={recordDataNotice}
          />
        ))}
      </div>
      {providerRemoved && (
        <div className="ai-assistant-panel__provider-notice" data-testid={TestId.aiAssistant.providerRemovedNotice}>
          {t('aiAssistant.providerChip.removedNotice')}
        </div>
      )}
      <AssistantContextNotice busy={busy} meter={contextMeter} onNewConversation={api.newConversation} />
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
        <AssistantComposerFooter api={api} area={area} contextMeter={contextMeter}>
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
