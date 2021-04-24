import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as AnalysisService from '../service'

export const init = (app) => {
  // ====== READ

  app.get(
    '/survey/:surveyId/chain/:chainUuid/chain-node-def/:entityDefUuid',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid, entityDefUuid } = Request.getParams(req)

        const chainNodeDefs = await AnalysisService.getManyChainNodeDefs({ surveyId, entityDefUuid, chainUuid })

        res.json(chainNodeDefs)
      } catch (error) {
        next(error)
      }
    }
  )
}
