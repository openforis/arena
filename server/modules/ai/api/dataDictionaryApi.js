/**
 * Express route for the data-dictionary feature (Tier 1 #7).
 *
 *   POST /api/ai/survey/:surveyId/dataDictionary/generate
 *
 * Body:
 *   { format: "html" | "md", lang?: string, fillMissingDescriptions?: boolean }
 *
 * Synchronous: returns the rendered file directly. The MVP caps AI
 * fill-in at 50 fields per call to keep response time bounded; a future
 * sprint can move this to a background Job for very large surveys.
 */
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as DataDictionaryService from '../service/dataDictionaryService'
import { requireAiFeaturesEnabled } from './aiMiddleware'

export const init = (app) => {
  app.post(
    '/ai/survey/:surveyId/dataDictionary/generate',
    AuthMiddleware.requireLoggedInUser,
    AuthMiddleware.requireSurveyEditPermission,
    requireAiFeaturesEnabled,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const { surveyId, format = 'html', lang, fillMissingDescriptions = true } = Request.getParams(req)
        const result = await DataDictionaryService.generate({
          user,
          surveyId: Number(surveyId),
          format,
          lang,
          fillMissingDescriptions,
        })

        res.setHeader('Content-Type', result.contentType)
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
        res.setHeader('X-AI-Count', String(result.aiCount))
        res.setHeader('X-Total-Entries', String(result.totalEntries))
        res.send(result.content)
      } catch (error) {
        next(error)
      }
    }
  )
}
