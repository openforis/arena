/**
 * Express routes for the Data Explorer AI features.
 *
 *   POST /api/ai/survey/:surveyId/data-query/generate
 *     Generates a query from a natural-language description.
 *     Body: { cycle: string, lang: string, description: string }
 *     Response: { query, explanation }
 *
 *   POST /api/ai/survey/:surveyId/data-query/summarize
 *     Suggests a name, label and description for the given query.
 *     Body: { cycle: string, lang: string, query: object }
 *     Response: { name, label, description }
 *
 * Permission: same as the Data Explorer query execution (record list view);
 * nothing is saved, the results are only applied in the client.
 */
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as DataQueryGenerateService from '../service/dataQueryGenerateService'
import * as DataQuerySummarizeService from '../service/dataQuerySummarizeService'
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

  app.post(
    '/ai/survey/:surveyId/data-query/summarize',
    AuthMiddleware.requireRecordListViewPermission,
    requireAiFeaturesEnabled,
    async (req, res, next) => {
      try {
        const user = Request.getUser(req)
        const { surveyId, cycle, lang } = Request.getParams(req)
        const query = Request.getJsonParam(req, 'query')
        const result = await DataQuerySummarizeService.summarize({
          user,
          surveyId: Number(surveyId),
          cycle,
          lang,
          query,
        })
        res.json(result)
      } catch (error) {
        next(error)
      }
    }
  )
}
