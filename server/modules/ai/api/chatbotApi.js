/**
 * Documentation Chatbot route.
 *
 *   POST /api/ai/chatbot/conversation
 *
 * Accepts the Vercel AI SDK v5 message shape and streams the assistant
 * reply through whichever AI provider the user has configured (or the
 * admin default). The wire envelope is `{ chunk?, error? }` plus a final
 * `[DONE]`.
 *
 * Gating: the user must have AI features enabled and the `chat` category
 * toggled on; a provider must resolve (user override → admin default).
 */
import { ENV } from '@core/processUtils'
import { getLanguageLabel } from '@core/app/languages'
import { defaultLanguage, supportedLanguages } from '@core/i18n/i18nFactory'

import * as Log from '@server/log/log'
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as AiSettingsService from '../service/aiSettingsService'
import * as ModelClient from '../service/modelClient'
import { validateMessages } from '../service/chatbotService'
import { formatStreamErrorForLog, formatStreamErrorForWire } from './sseErrorHelpers'

const logger = Log.getLogger('AiChatbotApi')

const CHATBOT_FEATURE = 'chatbot'

const CHATBOT_SYSTEM_PROMPT =
  'You are the Arena documentation assistant. Answer concisely and accurately based on what you know about the ' +
  'Open Foris Arena platform (a cloud platform for forest-inventory survey design, data collection, and ' +
  'analysis). If a question is outside that scope, say so briefly.'

// Resolve a client-supplied language code to a system-prompt instruction.
// Anything outside the supported set (or absent) falls back to the default
// language so a malformed value can never inject free text into the prompt.
const buildLanguageInstruction = (language) => {
  const lang = supportedLanguages.includes(language) ? language : defaultLanguage
  const label = getLanguageLabel(lang) || 'English'
  return ` Always respond in ${label}, regardless of the language of the question.`
}

const isChatEnabledForUser = (user) =>
  AiSettingsService.isCategoryEnabledForUser(user, AiSettingsService.featureCategories.chat)

// Convert validated v5 messages (`{ role, parts: [{type:'text', text}] }`)
// into the Vercel AI SDK v4 chat shape (`{ role, content: string }`).
const v5ToV4Messages = (messages) =>
  messages.map((m) => ({
    role: m.role,
    content: (m.parts || []).map((p) => p.text || '').join(''),
  }))

export const init = (app) => {
  app.get('/ai/chatbot/status', AuthMiddleware.requireLoggedInUser, async (req, res, next) => {
    try {
      res.json({ enabled: isChatEnabledForUser(Request.getUser(req)) })
    } catch (error) {
      next(error)
    }
  })

  app.post('/ai/chatbot/conversation', AuthMiddleware.requireLoggedInUser, async (req, res, next) => {
    try {
      const user = Request.getUser(req)
      if (!isChatEnabledForUser(user)) {
        res.status(404).json({ error: 'aiChatbotDisabled' })
        return
      }

      const body = Request.getBody(req)

      let messages
      try {
        messages = validateMessages(body?.messages)
      } catch (validationError) {
        res.status(validationError.statusCode || 400).json({ error: validationError.key || 'aiChatbotPayloadTooLarge' })
        return
      }

      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      res.flushHeaders?.()

      const abortController = new AbortController()
      req.on('close', () => abortController.abort())

      const writeEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

      const timeoutHandle = setTimeout(() => abortController.abort(), ENV.aiRequestTimeoutMs)

      try {
        const v4Messages = v5ToV4Messages(messages)
        const result = await ModelClient.streamChat({
          user,
          feature: CHATBOT_FEATURE,
          messages: v4Messages,
          system: CHATBOT_SYSTEM_PROMPT + buildLanguageInstruction(body?.language),
          signal: abortController.signal,
        })
        for await (const delta of result.textStream) {
          if (abortController.signal.aborted) break
          if (typeof delta === 'string' && delta.length > 0) writeEvent({ chunk: delta })
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          logger.error(formatStreamErrorForLog('chatbotConversation', error))
          writeEvent({ error: formatStreamErrorForWire(error) })
        }
      } finally {
        clearTimeout(timeoutHandle)
      }

      res.write('data: [DONE]\n\n')
      res.end()
    } catch (error) {
      next(error)
    }
  })
}
