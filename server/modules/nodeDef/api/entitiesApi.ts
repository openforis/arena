import type { Router } from 'express'
import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as NodeDefService from '../service/nodeDefService'

export const init = (app: Router) => {
  // ====== GET - virtual_entities

  app.get(
    '/survey/:surveyId/virtual-entities/',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, offset, limit } = Request.getParams(req)
        const list = await NodeDefService.fetchVirtualEntities({ surveyId, offset, limit })
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
        const { surveyId } = Request.getParams(req)
        const count = await NodeDefService.countVirtualEntities({ surveyId })
        res.json(count)
      } catch (error) {
        next(error)
      }
    }
  )
}
