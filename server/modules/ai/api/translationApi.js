/**
 * Express route for the survey-label translation feature (Tier 1 #1).
 *
 *   POST /api/ai/survey/:surveyId/translate
 *
 * Body:
 *   { sourceLang, targetLangs: [...], items: [{id,text,kind?}], glossary?: [...] }
 *
 * Permission: survey edit.
 */
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
        const { sourceLang, targetLangs, items, glossary } = Request.getBody(req)
        const result = await TranslationService.translate({
          user,
          sourceLang,
          targetLangs,
          items,
          glossary,
        })
        res.json(result)
      } catch (error) {
        next(error)
      }
    }
  )
}
