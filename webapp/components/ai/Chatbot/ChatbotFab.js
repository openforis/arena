import './Chatbot.scss'

import React, { useEffect, useState } from 'react'

import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'

import { onAiSettingsInvalidated } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import ChatbotPanel from './ChatbotPanel'

/**
 * Floating help button mounted once at the top of the authenticated app
 * shell. Probes the server on mount; renders nothing when the chatbot is
 * disabled at the admin level OR the user has the `chat` category toggle
 * off. Re-probes whenever the AI Settings panel saves so the FAB appears
 * / disappears without a page reload. Click toggles the side panel.
 */
const ChatbotFab = () => {
  const i18n = useI18n()
  const [enabled, setEnabled] = useState(null) // null = probing
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const probe = () => {
      API.aiChatbot
        .fetchStatus()
        .then((status) => {
          if (!cancelled) setEnabled(Boolean(status?.enabled))
        })
        .catch(() => {
          if (!cancelled) setEnabled(false)
        })
    }
    probe()
    const unsubscribe = onAiSettingsInvalidated(probe)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

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
