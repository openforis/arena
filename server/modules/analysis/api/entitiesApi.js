import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as AnalysisService from '../service'

export const init = (app) => {
  // ====== GET - virtual_entities

  app.get(
    '/survey/:surveyId/virtual-entities/',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { cycle, surveyId, offset, limit } = Request.getParams(req)
        const list = await AnalysisService.fetchVirtualEntities({ surveyId, cycle, offset, limit })
        res.json({ list })
      } catch (error) {
        next(error)
      }
    }
  )

  app.get(
    '/survey/:surveyId/virtual-entities/count',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { cycle, surveyId } = Request.getParams(req)
        const count = await AnalysisService.countVirtualEntities({ surveyId, cycle })
        res.json(count)
      } catch (error) {
        next(error)
      }
    }
  )
}
