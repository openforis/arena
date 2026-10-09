import './Chatbot.scss'

import React, { useState } from 'react'

import { useI18n } from '@webapp/store/system'

import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import ChatbotPanel from './ChatbotPanel'

/**
 * Floating help button mounted once in the authenticated app shell; rendered only when the chat is enabled
 * (system config, server flags and the user's AI settings). Click toggles the side panel.
 * @returns {React.ReactElement|null} The button and the panel.
 */
const ChatbotFab = () => {
  const i18n = useI18n()
  const enabled = useAiFeatureEnabled('chat')
  const [open, setOpen] = useState(false)

  if (!enabled) return null

  return (
    <>
      <button
        type="button"
        className="ai-chatbot-fab"
        title={i18n.t('aiChatbot.open')}
        aria-label={i18n.t('aiChatbot.open')}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ai-chatbot-fab__icon" aria-hidden="true" />
      </button>
      {open ? <ChatbotPanel onClose={() => setOpen(false)} /> : null}
    </>
  )
}

export default ChatbotFab
