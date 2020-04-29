import * as CategoryItem from '@core/survey/categoryItem'
import * as ApiRoutes from '@common/apiRoutes'

import * as Request from '@server/utils/request'
import * as Response from '@server/utils/response'
import * as AuthMiddleware from '@server/modules/auth/authApiMiddleware'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as RChainService from '@server/modules/analysis/service/rChainService'

export const init = (app) => {
  // ====== READ - Step entity data
  app.get(
    ApiRoutes.rChain.stepEntityData(':surveyId', ':cycle', ':stepUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, cycle, stepUuid } = Request.getParams(req)

        const data = await RChainService.fetchStepData(surveyId, cycle, stepUuid)

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

        await RChainService.persistResults(surveyId, cycle, stepUuid, filePath)

        Response.sendOk(res)
      } catch (e) {
        next(e)
      }
    }
  )

  // ====== UPDATE - Chain user scripts
  app.put(
    ApiRoutes.rChain.chainStatusExec(':surveyId', ':chainUuid'),
    AuthMiddleware.requireRecordAnalysisPermission,
    async (req, res, next) => {
      try {
        const { surveyId, chainUuid } = Request.getParams(req)
        const { statusExec } = Request.getBody(req)

        await RChainService.updateChainStatusExec({ surveyId, chainUuid, statusExec })

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

        await RChainService.persistUserScripts(surveyId, chainUuid, filePath)

        Response.sendOk(res)
      } catch (e) {
        next(e)
      }
    }
  )
}
