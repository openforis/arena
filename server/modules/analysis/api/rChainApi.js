import * as CategoryItem from '../../../../core/survey/categoryItem'
import * as ApiRoutes from '../../../../common/apiRoutes'

import * as Request from '../../../utils/request'
import * as Response from '../../../utils/response'
import * as AuthMiddleware from '../../auth/authApiMiddleware'
import * as CategoryService from '../../category/service/categoryService'
import * as AnalysisService from '../service'

export const init = (app) => {
  // ====== READ - Chain entity data
  app.get(
    ApiRoutes.rChain.entityData(':surveyId', ':cycle', ':chainUuid', ':entityDefUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, entityDefUuid } = Request.getParams(req)

        const data = await AnalysisService.fetchEntityData({ surveyId, cycle, entityDefUuid })

        res.json(data)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== READ - Category items
  app.get(
    ApiRoutes.rChain.categoryItemsData(':surveyId', ':categoryUuid'),
    AuthMiddleware.requireSurveyViewPermission,
    async (req, res, next) => {
      try {
        const { surveyId, categoryUuid, language, draft } = Request.getParams(req)

        const items = await CategoryService.fetchItemsByParentUuid(surveyId, categoryUuid, null, draft)

        const itemsSummary = items.map((item) => ({
          uuid: CategoryItem.getUuid(item),
          code: CategoryItem.getCode(item),
          label: CategoryItem.getLabel(language)(item),
        }))
        res.json(itemsSummary)
      } catch (error) {
        next(error)
      }
    }
  )

  // ====== UPDATE - Step entity data
  app.put(
    ApiRoutes.rChain.stepEntityData(':surveyId', ':cycle', ':stepUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const filePath = Request.getFilePath(req)
        const { surveyId, cycle, stepUuid } = Request.getParams(req)

        await AnalysisService._persistResults({ surveyId, cycle, stepUuid, filePath })

        Response.sendOk(res)
      } catch (e) {
        next(e)
      }
    }
  )

  app.put(
    ApiRoutes.rChain.entityData(':surveyId', ':cycle', ':chainUuid', ':entityDefUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const filePath = Request.getFilePath(req)
        const { surveyId, cycle, chainUuid, entityDefUuid } = Request.getParams(req)
        await AnalysisService.persistResults({ surveyId, cycle, entityDefUuid, chainUuid, filePath })

        Response.sendOk(res)
      } catch (e) {
        next(e)
      }
    }
  )

  // ====== UPDATE - Chain
  app.put(
    ApiRoutes.rChain.chainStatusExec(':surveyId', ':chainUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid } = Request.getParams(req)
        const { statusExec } = Request.getBody(req)
        const user = Request.getUser(req)
        await AnalysisService.updateChainStatusExec({ user, surveyId, chainUuid, statusExec })

        Response.sendOk(res)
      } catch (e) {
        next(e)
      }
    }
  )

  app.put(
    ApiRoutes.rChain.chainUserScripts(':surveyId', ':chainUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid } = Request.getParams(req)
        const filePath = Request.getFilePath(req)

        await AnalysisService.persistUserScripts({ surveyId, chainUuid, filePath })

        Response.sendOk(res)
      } catch (e) {
        next(e)
      }
    }
  )
}
