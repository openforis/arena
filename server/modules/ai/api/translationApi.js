/**
 * Express route for the survey-label translation feature (Tier 1 #1).
 *
 *   POST /api/ai/survey/:surveyId/translate
 *
 * Body:
 *   { requestId, sourceLang, targetLangs: [...], items: [{id,text,kind?}], glossary?: [...] }
 *
 * Responds immediately with 202; result is pushed via WebSocket (translationUpdate event).
 *
 * Permission: survey edit.
 */
import { WebSocketServer } from '@openforis/arena-server'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as TranslationService from '../service/translationService'
import { requireAiFeaturesEnabled } from './aiMiddleware'

export const init = (app) => {
  app.post(
    '/ai/survey/:surveyId/translate',
    AuthMiddleware.requireLoggedInUser,
    AuthMiddleware.requireSurveyEditPermission,
    requireAiFeaturesEnabled,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const socketId = Request.getSocketId(req)

        if (!socketId || !WebSocketServer.isSocketConnected(socketId)) {
          res.status(400).json({ error: { key: 'appErrors:aiTranslationSocketMissing' } })
          return
        }

        const { requestId, sourceLang, targetLangs, items, glossary } = Request.getBody(req)

        res.status(202).json({ requestId })

        TranslationService.translate({ user, sourceLang, targetLangs, items, glossary })
          .then((result) => {
            WebSocketServer.notifySocket(socketId, WebSocketEvents.translationUpdate, { requestId, result })
          })
          .catch((error) => {
            const errorPayload = error?.key
              ? { key: error.key, params: error.params }
              : { key: 'appErrors:generic', params: { text: error?.message ?? 'unknown' } }
            WebSocketServer.notifySocket(socketId, WebSocketEvents.translationUpdate, {
              requestId,
              error: errorPayload,
            })
          })
      } catch (error) {
        next(error)
      }
    }
  )
}
