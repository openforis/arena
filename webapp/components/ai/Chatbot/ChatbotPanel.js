import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import { getLanguageLabel } from '@core/app/languages'
import { defaultLanguage, supportedLanguages } from '@core/i18n/i18nFactory'

import * as API from '@webapp/service/api'
import { Button, ButtonMenu } from '@webapp/components/buttons'
import { useI18n, useI18nT, useLang } from '@webapp/store/system'

import ChatbotMessage from './ChatbotMessage'

const HISTORY_KEY = 'arena.chatbot.history'
const TITLE_KEY = 'arena.chatbot.title'
const LANG_KEY = 'arena.chatbot.language'

// Arena's resolved language can be region-qualified (e.g. `en-US`) and is
// not guaranteed to be one the chatbot supports — normalise to a bare,
// supported code, falling back to the default.
const normalizeLang = (lang) => {
  const base = (lang || '').split('-')[0]
  return supportedLanguages.includes(base) ? base : defaultLanguage
}

const loadHistory = () => {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveHistory = (messages) => {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages))
  } catch {
    // sessionStorage quota / disabled — silently ignore.
  }
}

const ChatbotPanel = ({ onClose }) => {
  const i18n = useI18n()
  const tUnescaped = useI18nT({ unescapeHtml: true })
  const arenaLang = useLang()

  // The full conversation. Stored in the v5 shape (`parts: [{ type:
  // 'text', text }]`) because that's exactly what we POST to the server,
  // saving an in/out conversion. Reasoning is held alongside per index in
  // a separate map (it doesn't round-trip to AIDA).
  const [messages, setMessages] = useState(loadHistory)
  const [reasoningByIdx, setReasoningByIdx] = useState({})
  const [title, setTitle] = useState(() => {
    try {
      return sessionStorage.getItem(TITLE_KEY) || ''
    } catch {
      return ''
    }
  })
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState(null)

  // The language the assistant is asked to reply in. Defaults to Arena's
  // current UI language (which itself follows the user preference /
  // browser); the user can override it from the header menu, and that
  // choice is remembered for the session.
  const [language, setLanguage] = useState(() => {
    try {
      const saved = sessionStorage.getItem(LANG_KEY)
      if (saved && supportedLanguages.includes(saved)) return saved
    } catch {
      // ignore
    }
    return normalizeLang(arenaLang)
  })

  const cancelRef = useRef(null)
  const bodyRef = useRef(null)

  // Persist on every change.
  useEffect(() => {
    saveHistory(messages)
  }, [messages])

  useEffect(() => {
    try {
      if (title) sessionStorage.setItem(TITLE_KEY, title)
    } catch {
      // ignore
    }
  }, [title])

  useEffect(() => {
    try {
      sessionStorage.setItem(LANG_KEY, language)
    } catch {
      // ignore
    }
  }, [language])

  // Auto-scroll on new content.
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, reasoningByIdx])

  // Cancel any in-flight stream on unmount.
  useEffect(
    () => () => {
      cancelRef.current?.()
    },
    []
  )

  const stripText = useCallback((msg) => msg?.parts?.map((p) => p.text || '').join('') || '', [])

  const onSend = useCallback(() => {
    const text = input.trim()
    if (!text || streaming) return
    setError(null)
    const userMsg = { role: 'user', parts: [{ type: 'text', text }] }
    // Insert the assistant placeholder so streaming chunks have a home.
    const assistantMsg = { role: 'assistant', parts: [{ type: 'text', text: '' }] }
    const nextMessages = [...messages, userMsg, assistantMsg]
    const assistantIdx = nextMessages.length - 1

    // We send the history up to and including the user turn — not the
    // empty assistant placeholder.
    const outboundMessages = [...messages, userMsg]

    setMessages(nextMessages)
    setInput('')
    setStreaming(true)

    cancelRef.current = API.aiChatbot.streamConversation({
      messages: outboundMessages,
      language,
      onChunk: (chunk) => {
        setMessages((prev) => {
          const updated = prev.slice()
          const current = updated[assistantIdx]
          if (!current) return prev
          updated[assistantIdx] = {
            ...current,
            parts: [{ type: 'text', text: stripText(current) + chunk }],
          }
          return updated
        })
      },
      onReasoning: (chunk) => {
        setReasoningByIdx((prev) => ({
          ...prev,
          [assistantIdx]: (prev[assistantIdx] || '') + chunk,
        }))
      },
      onTitle: (next) => setTitle(next),
      onDone: () => {
        setStreaming(false)
        cancelRef.current = null
      },
      onError: (err) => {
        setError(err?.message || 'unknown')
        setStreaming(false)
        cancelRef.current = null
      },
    })
  }, [input, language, messages, streaming, stripText])

  const onStop = useCallback(() => {
    cancelRef.current?.()
    cancelRef.current = null
    setStreaming(false)
  }, [])

  const onClear = useCallback(() => {
    cancelRef.current?.()
    cancelRef.current = null
    setMessages([])
    setReasoningByIdx({})
    setTitle('')
    setStreaming(false)
    setError(null)
    try {
      sessionStorage.removeItem(HISTORY_KEY)
      sessionStorage.removeItem(TITLE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const languageItems = useMemo(
    () =>
      supportedLanguages.map((langCode) => ({
        key: langCode,
        label: getLanguageLabel(langCode) ?? langCode,
        labelIsI18nKey: false,
      })),
    []
  )

  const onLanguageChange = useCallback((item) => setLanguage(item.key), [])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="ai-chatbot-panel" role="dialog" aria-modal="false">
      <div className="ai-chatbot-panel__header">
        <div className="ai-chatbot-panel__title">{title || i18n.t('aiChatbot.title')}</div>
        <div className="ai-chatbot-panel__header-actions">
          <ButtonMenu
            className="btn-s"
            iconClassName="icon-earth icon-16px"
            label={getLanguageLabel(language) ?? language}
            labelIsI18nKey={false}
            title="aiChatbot.language"
            items={languageItems}
            onItemClick={onLanguageChange}
            selectedItemKey={language}
            menuClassName="ai-chatbot-panel__language-menu"
            disabled={streaming}
          />
          <Button
            className="btn-s"
            label="aiChatbot.clear"
            onClick={onClear}
            disabled={streaming || messages.length === 0}
          />
          <Button className="btn-s" iconClassName="icon-cross icon-14px" onClick={onClose} title="common.close" />
        </div>
      </div>

      <div className="ai-chatbot-panel__body" ref={bodyRef}>
        {messages.length === 0 ? (
          <div className="ai-chatbot-panel__empty">{i18n.t('aiChatbot.empty')}</div>
        ) : (
          messages.map((m, idx) => (
            <ChatbotMessage
              key={idx}
              role={m.role}
              text={stripText(m)}
              reasoning={reasoningByIdx[idx]}
              streaming={streaming && idx === messages.length - 1 && m.role === 'assistant'}
            />
          ))
        )}
      </div>

      {error ? (
        <div className="ai-chatbot-panel__error">{tUnescaped('aiChatbot.error', { message: error })}</div>
      ) : null}

      <div className="ai-chatbot-panel__input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={i18n.t('aiChatbot.placeholder')}
          disabled={streaming}
        />
        <div className="ai-chatbot-panel__input-row">
          {streaming ? (
            <Button label="aiChatbot.stop" onClick={onStop} />
          ) : (
            <Button label="aiChatbot.send" onClick={onSend} disabled={!input.trim()} />
          )}
        </div>
      </div>
    </div>
  )
}

ChatbotPanel.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default ChatbotPanel
