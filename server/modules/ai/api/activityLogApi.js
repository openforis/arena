/**
 * SSE route for the activity-log summarization feature (Tier 1 #5).
 *
 *   GET /api/ai/survey/:surveyId/activityLog/summarize
 */
import * as Log from '@server/log/log'
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as ActivityLogSummarizerService from '../service/activityLogSummarizerService'
import { closeSseStream, createSseEventWriter, openSseStream } from './serverSentEvents'
import { formatErrorForLog, toAiWireError } from '../service/gateway/errorMapping'
import { requireAiFeaturesEnabled } from './aiMiddleware'

const logger = Log.getLogger('AiActivityLogApi')

export const init = (app) => {
  app.get(
    '/ai/survey/:surveyId/activityLog/summarize',
    AuthMiddleware.requireLoggedInUser,
    AuthMiddleware.requireSurveyViewPermission,
    requireAiFeaturesEnabled,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const { surveyId } = Request.getParams(req)

        openSseStream(res)

        const abortController = new AbortController()
        req.on('close', () => abortController.abort())

        const writeEvent = createSseEventWriter(res)

        try {
          const result = await ActivityLogSummarizerService.summarize({
            user,
            surveyId: Number(surveyId),
            signal: abortController.signal,
          })
          for await (const chunk of result.textStream) {
            if (abortController.signal.aborted) break
            writeEvent({ chunk })
          }
        } catch (error) {
          logger.error(formatErrorForLog('activityLogSummary', error))
          writeEvent({ error: toAiWireError(error).key })
        }

        closeSseStream(res)
      } catch (error) {
        next(error)
      }
    }
  )
}
