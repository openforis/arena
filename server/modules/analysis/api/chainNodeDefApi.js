import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as Response from '@server/utils/response'
import * as AnalysisService from '../service'

export const init = (app) => {

  // ====== UPDATE

  app.put(
    '/survey/:surveyId/chain/:chainUuid/chain-node-def',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId } = Request.getParams(req)
        const user = Request.getUser(req)
        const { chainNodeDef, newIndex } = Request.getBody(req)

        await AnalysisService.updateChainNodeDef({ user, surveyId, chainNodeDef, newIndex })

        Response.sendOk(res)
      } catch (error) {
        next(error)
      }
    }
  )
}
