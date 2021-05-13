import * as Request from '@server/utils/request'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'

import * as Response from '@server/utils/response'
import * as AnalysisService from '../service'

export const init = (app) => {
  // ====== READ

  app.get(
    '/survey/:surveyId/chain/:chainUuid/chain-node-def/count',
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid } = Request.getParams(req)

        const count = await AnalysisService.countChainNodeDefs({ surveyId, chainUuid })

        res.json(count)
      } catch (error) {
        next(error)
      }
    }
  )

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
