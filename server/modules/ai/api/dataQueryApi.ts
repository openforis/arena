/**
 * Express routes for the natural-language → Data Explorer query feature.
 *
 *   POST /api/ai/survey/:surveyId/data-query/generate
 *
 * Body:
 *   { cycle: string, lang: string, description: string }
 *
 * Response:
 *   { query, summary: { name, label, description }, explanation }
 *
 * Permission: same as the Data Explorer query execution (record list view);
 * the generated query is only applied in the client, not saved.
 */
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as DataQueryGenerateService from '../service/dataQueryGenerateService'
import { requireAiFeaturesEnabled } from './aiMiddleware'

export const init = (app) => {
  app.post(
    '/ai/survey/:surveyId/data-query/generate',
    AuthMiddleware.requireRecordListViewPermission,
    requireAiFeaturesEnabled,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const { surveyId, cycle, lang, description } = Request.getParams(req)
        const result = await DataQueryGenerateService.generate({
          user,
          surveyId: Number(surveyId),
          cycle,
          lang,
          description,
        })
        res.json(result)
      } catch (error) {
        next(error)
      }
    }
  )
}
