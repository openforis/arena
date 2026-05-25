/**
 * Express routes for the natural-language → expression feature (Tier 1 #2).
 *
 *   POST /api/ai/survey/:surveyId/expression/generate
 *
 * Body:
 *   { description: string, nodeDefUuid: string, expressionType: string }
 *
 * Response:
 *   { expression, explanation, confidence, isValid, parseError? }
 *
 * Permission: requires survey edit permission (matches the rest of the
 * Designer surface; only users who could write the expression manually can
 * ask the AI to draft it).
 */
import { ENV } from '@core/processUtils'

import * as Log from '@server/log/log'
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as ExpressionService from '../service/expressionService'
import { closeSseStream, createSseEventWriter, openSseStream } from './serverSentEvents'
import { formatStreamErrorForLog, formatStreamErrorForWire } from './sseErrorHelpers'

const logger = Log.getLogger('AiExpressionApi')

export const init = (app) => {
  app.post(
    '/ai/survey/:surveyId/expression/generate',
    AuthMiddleware.requireLoggedInUser,
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        if (!ENV.aiFeaturesEnabled) {
          res.status(404).json({ error: 'aiFeaturesDisabled' })
          return
        }
        const user = Request.getUser(req)
        const { surveyId, description, nodeDefUuid, expressionType } = Request.getParams(req)
        const result = await ExpressionService.generate({
          user,
          surveyId: Number(surveyId),
          nodeDefUuid,
          expressionType,
          description,
        })
        res.json(result)
      } catch (error) {
        next(error)
      }
    }
  )

  // GET so the browser's EventSource can connect; survey-edit auth still applies.
  app.get(
    '/ai/survey/:surveyId/expression/explain',
    AuthMiddleware.requireLoggedInUser,
    AuthMiddleware.requireSurveyEditPermission,
    async (req, res, next) => {
      try {
        if (!ENV.aiFeaturesEnabled) {
          res.status(404).json({ error: 'aiFeaturesDisabled' })
          return
        }
        const user = Request.getUser(req)
        const { surveyId, nodeDefUuid, expression, errorMessage } = Request.getParams(req)

        // Set up SSE response
        openSseStream(res)

        const abortController = new AbortController()
        req.on('close', () => abortController.abort())

        const writeEvent = createSseEventWriter(res)

        try {
          const result = await ExpressionService.explain({
            user,
            surveyId: Number(surveyId),
            nodeDefUuid,
            expression,
            errorMessage,
            signal: abortController.signal,
          })
          for await (const chunk of result.textStream) {
            if (abortController.signal.aborted) break
            writeEvent({ chunk })
          }
        } catch (error) {
          logger.error(formatStreamErrorForLog('expressionExplain', error))
          writeEvent({ error: formatStreamErrorForWire(error) })
        }

        closeSseStream(res)
      } catch (error) {
        next(error)
      }
    }
  )
}
