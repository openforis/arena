import React, { useEffect, useRef, useState } from 'react'

import { AiLimits } from '@common/ai/limits'

import { getAiDataLocationText } from '@webapp/ai/policy/aiFeatureAvailability'
import { Button } from '@webapp/components/buttons'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type { AssistantArea } from './assistantAreas'
import { RecordDataNotice } from './analysis/RecordDataNotice'
import { useRecordDataNotice } from './analysis/useAnalysisArea'
import { AssistantMessageView } from './AssistantMessage'
import type { AssistantConversationApi } from './useAssistantConversation'

// D3 adds cleaning
const areaEmptyKeys: Record<AssistantArea, string> = {
  design: 'aiAssistant.emptyDesign',
  analysis: 'aiAnalysis.empty',
  help: 'aiAssistant.emptyHelp',
}

/**
 * Messages and composer of the current conversation.
 * @param {object} props - Props.
 * @param {AssistantArea} props.area - Current area.
 * @param {AssistantConversationApi} props.api - Conversation state and actions.
 * @returns {React.ReactElement} The chat.
 */
export const AssistantChat = ({ area, api }: { area: AssistantArea; api: AssistantConversationApi }) => {
  const t = useI18nT({ unescapeHtml: true })
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const { conversation, busy, applying, engineNotice } = api
  const messages = conversation?.messages ?? []
  const lastId = messages.at(-1)?.id
  const recordDataNotice = useRecordDataNotice(conversation)

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
    api.send(text)
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
      <div aria-live="polite" className="ai-assistant-panel__messages" ref={listRef}>
        {messages.length === 0 && <p className="ai-assistant-panel__empty">{t(areaEmptyKeys[area])}</p>}
        {messages.map((message) => (
          <AssistantMessageView
            api={api}
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
      {recordDataNotice ? (
        <RecordDataNotice onNewConversation={api.newConversation} />
      ) : (
        <div className="ai-assistant-panel__composer">
          <textarea
            aria-label={t('aiAssistant.placeholder')}
            data-testid={TestId.aiAssistant.input}
            maxLength={AiLimits.assistantMessageMaxChars}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('aiAssistant.placeholder')}
            rows={3}
            value={input}
          />
          {busy ? (
            <Button label="aiAssistant.stop" onClick={api.stop} testId={TestId.aiAssistant.stopBtn} />
          ) : (
            <Button
              disabled={!input.trim() || applying}
              label="aiAssistant.send"
              onClick={onSend}
              primary
              testId={TestId.aiAssistant.sendBtn}
            />
          )}
        </div>
      )}
    </>
  )
}
