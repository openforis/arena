/**
 * SSE route for the activity-log summarization feature (Tier 1 #5).
 *
 *   GET /api/ai/survey/:surveyId/activityLog/summarize?from=...&to=...&userUuid=...
 */
import { ENV } from '@core/processUtils'

import * as Log from '@server/log/log'
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as ActivityLogSummarizerService from '../service/activityLogSummarizerService'
import { formatStreamErrorForLog, formatStreamErrorForWire } from './sseErrorHelpers'

const logger = Log.getLogger('AiActivityLogApi')

export const init = (app) => {
  app.get(
    '/ai/survey/:surveyId/activityLog/summarize',
    AuthMiddleware.requireLoggedInUser,
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        if (!ENV.aiFeaturesEnabled) {
          res.status(404).json({ error: 'aiFeaturesDisabled' })
          return
        }
        const user = Request.getUser(req)
        const { surveyId, from, to, userUuid } = Request.getParams(req)

        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache, no-transform')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders?.()

        const abortController = new AbortController()
        req.on('close', () => abortController.abort())

        const writeEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

        try {
          const result = await ActivityLogSummarizerService.summarize({
            user,
            surveyId: Number(surveyId),
            from,
            to,
            userUuid,
            signal: abortController.signal,
          })
          for await (const chunk of result.textStream) {
            if (abortController.signal.aborted) break
            writeEvent({ chunk })
          }
        } catch (error) {
          logger.error(formatStreamErrorForLog('activityLogSummary', error))
          writeEvent({ error: formatStreamErrorForWire(error) })
        }

        res.write('data: [DONE]\n\n')
        res.end()
      } catch (error) {
        next(error)
      }
    }
  )
}
