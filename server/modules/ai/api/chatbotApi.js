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
import { buildChatSystemPrompt } from '@common/ai/prompts/chat'
import { validateChatMessages } from '@common/ai/tasks/chat'

import * as Log from '@server/log/log'
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as AiSettingsService from '../service/aiSettingsService'
import * as ModelClient from '../service/modelClient'
import { closeSseStream, createSseEventWriter, openSseStream } from './serverSentEvents'
import { formatErrorForLog, toAiWireError } from '../service/gateway/errorMapping'

const logger = Log.getLogger('AiChatbotApi')

const CHATBOT_FEATURE = 'chatbot'

const isChatEnabledForUser = (user) =>
  AiSettingsService.isCategoryEnabledForUser(user, AiSettingsService.featureCategories.chat)

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
        messages = validateChatMessages(body?.messages)
      } catch (validationError) {
        res.status(validationError.statusCode || 400).json({ error: validationError.key || 'aiChatbotPayloadTooLarge' })
        return
      }

      openSseStream(res)

      const abortController = new AbortController()
      req.on('close', () => abortController.abort())

      const writeEvent = createSseEventWriter(res)

      const timeoutHandle = setTimeout(() => abortController.abort(), ENV.aiRequestTimeoutMs)

      try {
        const result = await ModelClient.streamChat({
          user,
          feature: CHATBOT_FEATURE,
          messages,
          system: buildChatSystemPrompt(body?.language),
          signal: abortController.signal,
        })
        for await (const delta of result.textStream) {
          if (abortController.signal.aborted) break
          if (typeof delta === 'string' && delta.length > 0) writeEvent({ chunk: delta })
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          logger.error(formatErrorForLog('chatbotConversation', error))
          writeEvent({ error: toAiWireError(error).key })
        }
      } finally {
        clearTimeout(timeoutHandle)
      }

      closeSseStream(res)
    } catch (error) {
      next(error)
    }
  })
}
